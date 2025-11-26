import re
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from app.database.mongodb import get_database
from app.models.mongodb import UserBan, RoomMember


# Profanity filter - simple implementation, would use a more robust library in production
class ProfanityFilter:
    def __init__(self):
        # Simple list of banned words (would be more extensive and configurable in production)
        self.banned_words = [
            "badword1",
            "badword2",
            "badword3",
        ]
        self.pattern = re.compile(r'\b(' + '|'.join(self.banned_words) + r')\b', re.IGNORECASE)
    
    def contains_profanity(self, text: str) -> bool:
        return bool(self.pattern.search(text))
    
    def censor_text(self, text: str) -> str:
        return self.pattern.sub(lambda m: '*' * len(m.group()), text)


# Rate limiter
class RateLimiter:
    def __init__(self):
        # In-memory store for rate limiting
        # In production, you'd use Redis for this
        self.message_timestamps = {}
    
    def check_rate_limit(self, user_id: str, messages_per_minute: int) -> bool:
        current_time = datetime.now()
        one_minute_ago = current_time - timedelta(minutes=1)
        
        # Create user entry if it doesn't exist
        if user_id not in self.message_timestamps:
            self.message_timestamps[user_id] = []
        
        # Filter out timestamps older than 1 minute
        self.message_timestamps[user_id] = [
            ts for ts in self.message_timestamps[user_id] 
            if ts >= one_minute_ago
        ]
        
        # Check if user has exceeded the rate limit
        if len(self.message_timestamps[user_id]) >= messages_per_minute:
            return False
        
        # Add current timestamp
        self.message_timestamps[user_id].append(current_time)
        return True


# Ban and mute checker
async def check_user_permissions(
    db: AsyncIOMotorClient = Depends(get_database), 
    user_id: str = None, 
    room_id: Optional[str] = None
) -> None:
    """Check if user is banned or muted"""
    
    # Check for global ban
    global_ban = await db["user_bans"].find_one({
        "user_id": ObjectId(user_id),
        "room_id": None,  # Global ban
        "$or": [
            {"expires_at": {"$exists": False}},
            {"expires_at": {"$gt": datetime.utcnow()}}  # Permanent or not expired
        ]
    })
    
    if global_ban:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are banned from the platform"
        )
    
    if room_id:
        # Check for room-specific ban
        room_ban = await db["user_bans"].find_one({
            "user_id": ObjectId(user_id),
            "room_id": ObjectId(room_id),
            "$or": [
                {"expires_at": {"$exists": False}},
                {"expires_at": {"$gt": datetime.utcnow()}}  # Permanent or not expired
            ]
        })
        
        if room_ban:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are banned from this room"
            )
        
        # Check for mute
        muted_member = await db["room_members"].find_one({
            "user_id": ObjectId(user_id),
            "room_id": ObjectId(room_id),
            "is_muted": True,
            "$or": [
                {"muted_until": {"$exists": False}},
                {"muted_until": {"$gt": datetime.utcnow()}}
            ]
        })
        
        if muted_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are muted in this room"
            )


# Initialize the moderation tools
profanity_filter = ProfanityFilter()
rate_limiter = RateLimiter() 