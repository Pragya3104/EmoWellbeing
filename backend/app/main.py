from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path

from .auth import auth_router
from .chat import chat_router
from .mood import mood_router
from .contact import contact_router
from .database import engine, Base
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler
from .limiter import limiter
from .auth import auth_router

# Load .env
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

app = FastAPI(title="Emowell — Emotional Wellbeing API")
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler
)

app.include_router(auth_router)


# -------------------------
# CORS
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# DATABASE INIT
# -------------------------
@app.on_event("startup")
def on_startup():
    # Create tables if not exist
    pass


# -------------------------
# ROUTES
# -------------------------
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(mood_router)
app.include_router(contact_router)
