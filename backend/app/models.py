from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from .database import Base


class User(Base):
    __tablename__ = "users"

    id         = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name       = Column(String(100), nullable=False)
    email      = Column(String(255), unique=True, index=True, nullable=False)
    password   = Column(String(255), nullable=True)           # nullable for Google OAuth users
    provider   = Column(String(20), nullable=False, default="local")  # local | google

    # ── Profile extras ──────────────────────────────────────
    bio            = Column(Text,        nullable=True)
    theme          = Column(String(30),  nullable=True, default="purple")
    tips_enabled   = Column(Boolean,     default=False)
    notif_chat     = Column(Boolean,     default=True)
    notif_mood     = Column(Boolean,     default=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    chats  = relationship("ChatMessage", back_populates="user")
    moods  = relationship("MoodEntry",   back_populates="user")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id              = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"))
    user_id         = Column(Integer, ForeignKey("users.id"))

    message    = Column(Text,    nullable=False)
    response   = Column(Text,    nullable=False)
    sentiment  = Column(String(20))
    confidence = Column(Float)
    timestamp  = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="messages")
    user         = relationship("User",         back_populates="chats")


class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id        = Column(Integer, primary_key=True, index=True)
    user_id   = Column(Integer, ForeignKey("users.id"))
    mood      = Column(String(50), nullable=False)
    note      = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="moods")


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(100))
    email      = Column(String(255))
    message    = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id         = Column(Integer, primary_key=True, index=True)
    token      = Column(String(512), unique=True, nullable=False)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False)   # FIX: was "revoked", queries use "is_revoked"
    user       = relationship("User", backref="refresh_tokens")


class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    id         = Column(Integer, primary_key=True)
    jti        = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Conversation(Base):
    __tablename__ = "conversations"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title      = Column(String(255), default="New Chat")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user     = relationship("User", backref="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete")