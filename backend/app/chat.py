from fastapi import APIRouter, Depends, HTTPException
from typing import Any
from datetime import datetime, timezone
from .models import ChatRequest
from .db import get_db
from .auth import get_current_user
from .hf_sentiment import analyze_sentiment
from .llm_client import generate_ai_reply
from bson import ObjectId
from .utils import fix_mongo_id

chat_router = APIRouter(prefix="/api/chat")

@chat_router.post("/send")
async def send_message(
    data: ChatRequest,
    db = Depends(get_db),
    user =Depends(get_current_user),
):
    print("\n TOKEN RECEIVED IN BACKEND ===>", user.id)
    """
    Accepts a chat message from an authenticated user, analyzes sentiment,
    gets AI reply, stores the chat and returns the saved entry.
    This handler is defensive about the shape of `user` (dict or object).
    """

    try:
        # Determine user id safely (support dicts and objects)
        if isinstance(user, dict):
            user_id = user.get("id") or user.get("_id")
            user_email = user.get("email")
        else:
            # Pydantic model or simple object
            user_id = getattr(user, "id", None) or getattr(user, "_id", None)
            user_email = getattr(user, "email", None)

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user credentials")

        # Analyze & generate
        sentiment, confidence = analyze_sentiment(data.message)
        ai_reply = generate_ai_reply(data.message)

        entry = {
            "user_id": str(user_id),
            "user_email": user_email,
            "message": data.message,
            "response": ai_reply,
            "sentiment": sentiment,
            "confidence": float(confidence),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        result = await db.chat_messages.insert_one(entry)

        # append db id before returning
        entry["id"] = str(result.inserted_id)

        return fix_mongo_id(entry)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error in send_message: %s", e)
        raise HTTPException(status_code=500, detail="Failed to process message")
