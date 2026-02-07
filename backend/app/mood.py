from fastapi import APIRouter, Depends
from .models import MoodCheckIn
from .db import get_db
from .auth import get_current_user
from datetime import datetime, timezone
from bson import ObjectId
from .utils import fix_mongo_id

mood_router = APIRouter(prefix="/api/mood")

@mood_router.post("/checkin")
async def checkin(mood: MoodCheckIn, db=Depends(get_db), user=Depends(get_current_user)):
    entry = {
        "user_id": user.id,
        "mood": mood.mood,
        "note": mood.note,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.mood_entries.insert_one(entry)
    return fix_mongo_id(entry)


@mood_router.get("/trends")
async def get_mood_trends(db=Depends(get_db), user=Depends(get_current_user)):
    moods = await db.mood_entries.find({"user_id": user.id}).to_list(100)

    formatted = []
    for m in moods:
        formatted.append({
            "id": str(m["_id"]),
            "mood": m["mood"],
            "note": m.get("note", ""),
            "timestamp": m["timestamp"],
            "date": m["timestamp"].split("T")[0]  # YYYY-MM-DD
        })

    return fix_mongo_id({
        "count": len(formatted),
        "data": formatted
    })
