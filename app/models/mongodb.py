from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, EmailStr, ValidationError, BeforeValidator
from typing_extensions import Annotated
from bson import ObjectId

# Represents an ObjectId field in the database.
# It is used to validate and convert the _id field of MongoDB documents.
PyObjectId = Annotated[str, BeforeValidator(str)]

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    username: str
    email: EmailStr
    password_hash: str
    role: Literal["regular", "moderator", "admin"] = "regular"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    phone_number: Optional[str] = None
    status: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "username": "testuser",
                "email": "test@example.com",
                "password_hash": "hashedpassword",
            }
        }

class Room(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    description: Optional[str] = None
    join_code: Optional[str] = None
    is_private: bool = False
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    max_members: Optional[int] = None
    is_temporary: bool = False
    expires_at: Optional[datetime] = None
    member_count: Optional[int] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "name": "General Chat",
                "description": "General discussion room",
                "created_by": "60a7b1b3b3e3c3f3e3e3e3e3",
            }
        }

class Message(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    room_id: PyObjectId
    user_id: PyObjectId
    content: str
    message_type: Literal["text", "image", "video", "file", "embed", "system", "encrypted", "broadcast"] = "text"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    edited_at: Optional[datetime] = None
    scheduled_for: Optional[datetime] = None
    is_encrypted: bool = False
    encryption_metadata: Optional[str] = None
    is_broadcast: bool = False
    broadcast_rooms: Optional[List[PyObjectId]] = None
    deletion_type: Literal["for_me", "for_everyone", "not_deleted"] = "not_deleted"
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[PyObjectId] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "room_id": "60a7b1b3b3e3c3f3e3e3e3e3",
                "user_id": "60a7b1b3b3e3c3f3e3e3e3e3",
                "content": "Hello, everyone!",
            }
        }

class MessageReaction(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    message_id: PyObjectId
    user_id: PyObjectId
    emoji: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class MessageReport(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    message_id: PyObjectId
    reporter_id: PyObjectId
    reason: str
    is_resolved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class MessageReadReceipt(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    message_id: PyObjectId
    user_id: PyObjectId
    read_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class RoomMember(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    room_id: PyObjectId
    user_id: PyObjectId
    role: Literal["member", "admin"] = "member"
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    is_muted: bool = False
    muted_until: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class UserBan(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: PyObjectId
    room_id: Optional[PyObjectId] = None  # If room_id is None, it's a global ban
    banned_by: PyObjectId
    reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
