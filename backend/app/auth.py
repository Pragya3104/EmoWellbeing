import email
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import timedelta, datetime
import os

from .db import get_db
from .models import User, RefreshToken, TokenBlacklist, ChatMessage, MoodEntry, Conversation
from .schemas import (
    UserRegister, Token, UserResponse,
    UpdateProfileRequest, ChangePasswordRequest,
)
from .utils import (
    OAUTH_PASSWORD_PLACEHOLDER,
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    validate_password,
)
from .limiter import limiter
import requests
from fastapi.responses import RedirectResponse

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI")
GOOGLE_SCOPES        = "openid email profile"
FRONTEND_URL         = os.getenv("FRONTEND_URL")

auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

SECRET_KEY                  = os.getenv("SECRET_KEY")
ALGORITHM                   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS   = 7


# ─────────────────────────────────────────
# REGISTER
# ─────────────────────────────────────────
@auth_router.post("/register", response_model=UserResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="User already exists")

    validate_password(user.password)

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ─────────────────────────────────────────
# LOGIN
# ─────────────────────────────────────────
@auth_router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    refresh_data  = create_refresh_token(user.id)
    refresh_token = refresh_data["token"]
    expires_at    = refresh_data["expires_at"]

    db.add(RefreshToken(
        user_id=user.id,
        token=refresh_token,
        expires_at=expires_at
    ))
    db.commit()

    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "token_type":    "bearer",
        "user":          user,
    }


# ─────────────────────────────────────────
# REFRESH TOKEN
# ─────────────────────────────────────────
@auth_router.post("/refresh")
def refresh(refresh_token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401)

        user_id = payload.get("sub")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    token_db = (
        db.query(RefreshToken)
        .filter(
            RefreshToken.token == refresh_token,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > datetime.utcnow()
        )
        .first()
    )

    if not token_db:
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    new_access = create_access_token(
        data={"sub": str(user_id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {"access_token": new_access, "token_type": "bearer"}


# ─────────────────────────────────────────
# GET CURRENT USER (dependency)
# ─────────────────────────────────────────
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "access":
            raise HTTPException(status_code=401)

        jti     = payload.get("jti")
        user_id = payload.get("sub")

        if not jti or not user_id:
            raise HTTPException(status_code=401)

        if db.query(TokenBlacklist).filter(TokenBlacklist.jti == jti).first():
            raise HTTPException(status_code=401, detail="Token revoked")

    except jwt.JWTError:
        raise HTTPException(status_code=401)

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401)

    return user


# ─────────────────────────────────────────
# LOGOUT
# ─────────────────────────────────────────
@auth_router.post("/logout")
def logout(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "access":
            raise HTTPException(status_code=400)

        jti = payload.get("jti")
        exp = payload.get("exp")

        if not jti:
            raise HTTPException(status_code=400)

        db.add(TokenBlacklist(
            jti=jti,
            expires_at=datetime.utcfromtimestamp(exp)
        ))

        db.query(RefreshToken).filter(
            RefreshToken.user_id == int(payload["sub"]),
            RefreshToken.is_revoked == False
        ).update({"is_revoked": True})

        db.commit()
        return {"message": "Logged out successfully"}

    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ─────────────────────────────────────────
# GET ME
# ─────────────────────────────────────────
@auth_router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ─────────────────────────────────────────
# UPDATE PROFILE  (name, bio, theme, prefs)
# ─────────────────────────────────────────
@auth_router.patch("/profile", response_model=UserResponse)
def update_profile(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if data.name is not None:
        if not data.name.strip():
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        user.name = data.name.strip()

    if data.bio          is not None: user.bio          = data.bio
    if data.theme        is not None: user.theme        = data.theme
    if data.tips_enabled is not None: user.tips_enabled = data.tips_enabled
    if data.notif_chat   is not None: user.notif_chat   = data.notif_chat
    if data.notif_mood   is not None: user.notif_mood   = data.notif_mood

    db.commit()
    db.refresh(user)
    return user


# ─────────────────────────────────────────
# CHANGE PASSWORD
# ─────────────────────────────────────────
@auth_router.patch("/password")
def change_password(
    data: ChangePasswordRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Google OAuth users have no password
    if user.provider == "google":
        raise HTTPException(
            status_code=400,
            detail="Google accounts cannot change password here. Use Google account settings."
        )

    if not verify_password(data.old_password, user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")

    validate_password(data.new_password)

    if verify_password(data.new_password, user.password):
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    user.password = hash_password(data.new_password)

    # Revoke all existing refresh tokens — forces re-login on other devices
    db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.is_revoked == False
    ).update({"is_revoked": True})

    db.commit()
    return {"message": "Password changed successfully"}


# ─────────────────────────────────────────
# DELETE ACCOUNT
# ─────────────────────────────────────────
@auth_router.delete("/account")
def delete_account(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user_id = user.id

    # 1. Delete all chat messages
    db.query(ChatMessage).filter(ChatMessage.user_id == user_id).delete()

    # 2. Delete all conversations
    db.query(Conversation).filter(Conversation.user_id == user_id).delete()

    # 3. Delete all mood entries
    db.query(MoodEntry).filter(MoodEntry.user_id == user_id).delete()

    # 4. Revoke all refresh tokens
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()

    # 5. Delete the user
    db.delete(user)
    db.commit()

    return {"message": "Account deleted successfully"}


# ─────────────────────────────────────────
# WELLNESS TIP  (Groq-powered, mood-aware)
# ─────────────────────────────────────────
@auth_router.get("/tip")
def get_wellness_tip(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Returns a personalised wellness tip generated by Groq.
    Uses the user's last 5 mood entries as context so the tip
    feels relevant to how they've actually been feeling.
    If tips_enabled is False, still works — frontend controls visibility.
    """
    from .llm_client import get_groq_client   # reuse your existing Groq setup

    # Fetch last 5 mood entries for context
    recent_moods = (
        db.query(MoodEntry)
        .filter(MoodEntry.user_id == user.id)
        .order_by(MoodEntry.timestamp.desc())
        .limit(5)
        .all()
    )

    if recent_moods:
        mood_summary = ", ".join(
            f"{m.mood} ({m.timestamp.strftime('%b %d')})" for m in reversed(recent_moods)
        )
        context = f"The user's recent moods have been: {mood_summary}."
    else:
        context = "The user has not logged any moods yet."

    prompt = f"""You are a compassionate wellness companion.

{context}

Give this person ONE short, warm, practical wellness tip that fits how they have been feeling.
Rules:
- Maximum 2 sentences.
- No markdown, no bullet points, no bold text.
- Friendly and human — not clinical.
- Do not mention their mood labels explicitly.
- End with a gentle encouraging note."""

    try:
        client   = get_groq_client()
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=120,
            temperature=0.8,
        )
        tip = response.choices[0].message.content.strip()
    except Exception as e:
        # Fallback tip if Groq fails
        tip = "Take a few slow, deep breaths and remind yourself that it's okay to take things one moment at a time. You're doing better than you think. 💜"

    return {"tip": tip}


# ─────────────────────────────────────────
# GOOGLE OAUTH
# ─────────────────────────────────────────
@auth_router.get("/google/login")
def google_login():
    params = {
        "client_id":     GOOGLE_CLIENT_ID,
        "redirect_uri":  GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope":         GOOGLE_SCOPES,
        "access_type":   "offline",
        "prompt":        "consent",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url)


@auth_router.get("/google/callback")
def google_callback(request: Request, db: Session = Depends(get_db)):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")

    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id":     GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code":          code,
            "grant_type":    "authorization_code",
            "redirect_uri":  GOOGLE_REDIRECT_URI,
        },
    ).json()

    google_access_token = token_res.get("access_token")
    if not google_access_token:
        raise HTTPException(status_code=400, detail="Google token failed")

    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {google_access_token}"},
    ).json()

    email_addr = userinfo.get("email")
    name       = userinfo.get("name") or "User"

    if not email_addr:
        raise HTTPException(status_code=400, detail="Email not found")

    user = db.query(User).filter(User.email == email_addr).first()
    if not user:
        user = User(name=name, email=email_addr, provider="google", password="__GOOGLE__")
        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=60),
    )

    return RedirectResponse(url=f"http://localhost:5173/oauth-success?token={jwt_token}")


@auth_router.get("/oauth/success")
def oauth_success(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = payload.get("sub")
    user    = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401)

    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email},
    }