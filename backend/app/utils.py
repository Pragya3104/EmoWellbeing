from http.client import HTTPException
import token
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
TOKEN_EXPIRE = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))

# Hash password
def hash_password(password: str) -> str:
    password = password.encode("utf-8")[:72]  # ✅ Prevent bcrypt 72-byte crash
    return pwd.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    plain_password = plain_password.encode("utf-8")[:72]
    return pwd.verify(plain_password, hashed_password)

# Token generator
def create_access_token(user_id: str):
    expire = datetime.now(timezone.utc) + timedelta(days=1)
    print("🚀 SECRET WHILE SIGNING TOKEN:", SECRET_KEY)
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }

    # ✅ Correct: ENCODE the token, do NOT decode it here
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def fix_mongo_id(doc):
    if isinstance(doc, list):
        return [fix_mongo_id(d) for d in doc]
    if isinstance(doc, dict):
        doc["_id"] = str(doc["_id"]) if "_id" in doc else None
        return doc
    return doc
