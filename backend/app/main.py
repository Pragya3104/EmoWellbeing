from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from .auth import auth_router
from .chat import chat_router
from .mood import mood_router
from .contact import contact_router

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "emowell_db")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")

if not MONGO_URL:
    raise RuntimeError("❌ MONGO_URL missing in .env")

client = AsyncIOMotorClient(MONGO_URL)

app = FastAPI(title="Emowell — Emotional Wellbeing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    app.state.db = client[DB_NAME]

@app.on_event("shutdown")
async def shutdown():
    client.close()

# Routes
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(mood_router)
app.include_router(contact_router)

