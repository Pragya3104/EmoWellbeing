from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# =========================
# AUTH SCHEMAS
# =========================

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id:           int
    name:         str
    email:        EmailStr
    bio:          Optional[str]   = None
    theme:        Optional[str]   = "purple"
    tips_enabled: Optional[bool]  = False
    notif_chat:   Optional[bool]  = True
    notif_mood:   Optional[bool]  = True
    created_at:   datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token:  str
    token_type:    str
    user:          UserResponse


# ── Update profile ──────────────────────────────────────────
class UpdateProfileRequest(BaseModel):
    name:         Optional[str]  = None
    bio:          Optional[str]  = None
    theme:        Optional[str]  = None
    tips_enabled: Optional[bool] = None
    notif_chat:   Optional[bool] = None
    notif_mood:   Optional[bool] = None


# ── Change password ─────────────────────────────────────────
class ChangePasswordRequest(BaseModel):
    old_password:     str
    new_password:     str
    confirm_password: str


# =========================
# CHAT SCHEMAS
# =========================

class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    id:         int
    message:    str
    response:   str
    sentiment:  str
    confidence: float
    timestamp:  datetime

    class Config:
        from_attributes = True


# =========================
# MOOD SCHEMAS
# =========================

class MoodCheckIn(BaseModel):
    mood: str
    note: Optional[str] = None


# =========================
# CONTACT SCHEMAS
# =========================

class ContactMessageCreate(BaseModel):
    name:    str
    email:   EmailStr
    message: str