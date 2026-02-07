import token
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from .models import UserRegister, UserLogin, User, Token
from .db import get_db
from .utils import hash_password, verify_password, create_access_token
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

auth_router = APIRouter(prefix="/api/auth")
oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
if not SECRET_KEY or not isinstance(SECRET_KEY, str):
    raise RuntimeError(f"❌ Invalid SECRET_KEY. Got: {SECRET_KEY} (type: {type(SECRET_KEY)})")


async def get_current_user(request: Request, db=Depends(get_db)):
    token = request.headers.get("Authorization")

    print("\n🔥 RAW TOKEN HEADER:", token)  # ✅ this MUST print

    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")

    token = token.split(" ")[1]  # remove Bearer prefix
    
    print("🔑 SECRET USED FOR DECODING:", SECRET_KEY)
    print("🧾 TOKEN ONLY:", token)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        uid = payload.get("sub")
        if not uid: 
            raise Exception
    except Exception as e:
        print("❌ JWT ERROR:", str(e))
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = await db.users.find_one({"id": uid})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return User(**user)


@auth_router.post("/register", response_model=Token)
async def register(data: UserRegister, db=Depends(get_db)):

    # Check if user exists
    if await db.users.find_one({"email": data.email}):
        raise HTTPException(400, "User already exists")

    # Create user model instance
    new_user = User(
        name=data.name,
        email=data.email
    )

    # Insert into DB
    inserted = await db.users.insert_one({
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "password": hash_password(data.password)
    })

    # Create JWT token
    token = create_access_token(new_user.id)

    # Return correct response
    return Token(
        access_token=token,
        token_type="bearer",
        user=new_user
    )


@auth_router.post("/login")
async def login(data: UserLogin, db=Depends(get_db)):
    user = await db.users.find_one({"email": data.email})
    
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")
    print("🚀 SECRET WHILE SIGNING TOKEN:", SECRET_KEY)


    token = create_access_token(user["id"])

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["id"]),
            "name": user["name"],
            "email": user["email"],
        }
    }
