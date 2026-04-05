from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .schemas import ChatRequest
from .models import ChatMessage
from .db import get_db
from .auth import get_current_user
from .hf_sentiment import analyze_sentiment
from .llm_client import generate_ai_reply
from .models import Conversation

chat_router = APIRouter(prefix="/api/chat")


@chat_router.post("/send")
def send_message(
    data: ChatRequest,
    conversation_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):

    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user.id
    ).first()

    if not conversation:
        raise HTTPException(404, "Conversation not found")

    sentiment, confidence = analyze_sentiment(data.message)
    ai_reply = generate_ai_reply(data.message)

    chat = ChatMessage(
        conversation_id=conversation.id,
        user_id=user.id,
        message=data.message,
        response=ai_reply,
        sentiment=sentiment,
        confidence=float(confidence),
    )

    db.add(chat)

    # Auto-generate title if first message
    if conversation.title == "New Chat":
        conversation.title = data.message[:40]

    db.commit()
    db.refresh(chat)

    return chat


@chat_router.get("/history")
def get_chat_history(
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    chats = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == user.id)
        .order_by(ChatMessage.timestamp.asc())
        .all()
    )

    return chats

@chat_router.post("/conversation")
def create_conversation(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    conversation = Conversation(user_id=user.id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation

@chat_router.get("/conversations")
def get_conversations(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return db.query(Conversation)\
        .filter(Conversation.user_id == user.id)\
        .order_by(Conversation.created_at.desc())\
        .all()

@chat_router.get("/conversation/{conversation_id}")
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return db.query(ChatMessage)\
        .filter(
            ChatMessage.conversation_id == conversation_id,
            ChatMessage.user_id == user.id
        )\
        .order_by(ChatMessage.timestamp)\
        .all()


# ✅ DELETE CONVERSATION (cascades to all its messages)
@chat_router.delete("/conversation/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user),
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == user.id
    ).first()

    if not conversation:
        raise HTTPException(404, "Conversation not found")

    # Delete all messages in this conversation first
    db.query(ChatMessage).filter(
        ChatMessage.conversation_id == conversation_id
    ).delete()

    # Then delete the conversation itself
    db.delete(conversation)
    db.commit()

    return { "success": True, "deleted_id": conversation_id }