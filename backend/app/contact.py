from fastapi import APIRouter, Depends
from .models import ContactMessage
from .db import get_db

contact_router = APIRouter(prefix="/api/contact")

@contact_router.post("/")
async def contact(msg: ContactMessage, db=Depends(get_db)):
    await db.contact_messages.insert_one(msg.dict())
    return {"status": "received"}
