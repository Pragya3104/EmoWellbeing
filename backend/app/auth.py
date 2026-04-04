import email
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import timedelta, datetime
import os

from .db import get_db
from .models import User, RefreshToken, TokenBlacklist
from .schemas import UserRegister, Token, UserResponse
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
from datetime import timedelta

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
GOOGLE_SCOPES = "openid email profile"
FRONTEND_URL = os.getenv("FRONTEND_URL")

auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

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

    refresh_data = create_refresh_token(user.id)

    refresh_token = refresh_data["token"]
    expires_at = refresh_data["expires_at"]

    db.add(
        RefreshToken(
            user_id=user.id,
            token=refresh_token,
            expires_at=expires_at
        )
    )
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user
    }

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

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "access":
            raise HTTPException(status_code=401)

        jti = payload.get("jti")
        user_id = payload.get("sub")

        if not jti or not user_id:
            raise HTTPException(status_code=401)

        blacklisted = db.query(TokenBlacklist).filter(
            TokenBlacklist.jti == jti
        ).first()

        if blacklisted:
            raise HTTPException(status_code=401, detail="Token revoked")

    except jwt.JWTError:
        raise HTTPException(status_code=401)

    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user:
        raise HTTPException(status_code=401)

    return user

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

        blacklist = TokenBlacklist(
            jti=jti,
            expires_at=datetime.utcfromtimestamp(exp)
        )

        db.add(blacklist)

        # Revoke all refresh tokens for user
        db.query(RefreshToken).filter(
            RefreshToken.user_id == int(payload["sub"]),
            RefreshToken.is_revoked == False
        ).update({"is_revoked": True})

        db.commit()

        return {"message": "Logged out successfully"}

    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    
@auth_router.get("/google/login")
def google_login():
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": GOOGLE_SCOPES,
        "access_type": "offline",
        "prompt": "consent",
    }

    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return RedirectResponse(url)

from fastapi.responses import RedirectResponse

@auth_router.get("/google/callback")
def google_callback(request: Request, db: Session = Depends(get_db)):

    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")

    # 1️⃣ Exchange code for token
    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": GOOGLE_REDIRECT_URI,
        },
    ).json()

    google_access_token = token_res.get("access_token")
    if not google_access_token:
        raise HTTPException(status_code=400, detail="Google token failed")

    # 2️⃣ Fetch user info
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {google_access_token}"},
    ).json()

    email = userinfo.get("email")
    name = userinfo.get("name") or "User"

    if not email:
        raise HTTPException(status_code=400, detail="Email not found")

    # 3️⃣ Find or create user
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            name=name,
            email=email,
            provider="google",
            password="__GOOGLE__"  # NOT NULL workaround ✔
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 4️⃣ Create JWT
    jwt_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=60),
    )

    # 5️⃣ Redirect ONLY with token
    frontend_url = f"http://localhost:5173/oauth-success?token={jwt_token}"
    return RedirectResponse(url=frontend_url)

@auth_router.get("/oauth/success")
def oauth_success(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = payload.get("sub")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
        },
    }


@auth_router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
