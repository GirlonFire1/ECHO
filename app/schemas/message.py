from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from app.schemas.user import User

class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    FILE = "file"
    EMBED = "embed"
    SYSTEM = "system"
    ENCRYPTED = "encrypted"
    BROADCAST = "broadcast"

class DeletionType(str, Enum):
    FOR_ME = "for_me"
    FOR_EVERYONE = "for_everyone"
    NOT_DELETED = "not_deleted"

# Shared properties
class MessageBase(BaseModel):
    content: str
    message_type: MessageType = MessageType.TEXT
    scheduled_for: Optional[datetime] = None
    is_encrypted: bool = False
    is_broadcast: bool = False

# Properties to receive on message creation
class MessageCreate(MessageBase):
    content: str = Field(..., max_length=2000)
    room_id: str
    encryption_metadata: Optional[str] = None

# Properties to receive on message update
class MessageUpdate(BaseModel):
    content: str = Field(..., max_length=2000)
    
# Properties for admin broadcast messages
class BroadcastMessageCreate(BaseModel):
    content: str = Field(..., max_length=2000)
    room_ids: List[str] = []  # Empty list means broadcast to all rooms
    message_type: MessageType = MessageType.BROADCAST

# Properties shared by models stored in DB
class MessageInDBBase(MessageBase):
    id: str
    user_id: str
    room_id: str
    created_at: datetime
    edited_at: Optional[datetime] = None
    encryption_metadata: Optional[str] = None
    # broadcast_rooms: Optional[List[str]] = None # Not simple in SQL
    deletion_type: DeletionType = DeletionType.NOT_DELETED
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None

    class Config:
        from_attributes = True

# Properties to return to client
class Message(MessageInDBBase):
    user_id: Optional[str] = None # Override to allow None for deleted users
    user: Optional[User] = None # Sender
    reaction_count: int = 0

# Message Reaction
class MessageReaction(BaseModel):
    id: str
    message_id: str
    user_id: str
    emoji: str
    created_at: datetime
    user: Optional[User] = None

    class Config:
        from_attributes = True

# Message with reactions
class MessageWithReactions(Message):
    reactions: List[MessageReaction] = []

# Message Report
class MessageReport(BaseModel):
    id: str
    message_id: str
    reporter_id: str
    reason: str
    is_resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None
    reporter: Optional[User] = None
    message: Optional[Message] = None

    class Config:
        from_attributes = True

# Message Report Create
class MessageReportCreate(BaseModel):
    reason: str = Field(..., max_length=500)

# Message Read Receipt
class MessageReadReceipt(BaseModel):
    id: str
    message_id: str
    user_id: str
    read_at: datetime # SQL model might not have this, check model
    user: Optional[User] = None
    
    class Config:
        from_attributes = True
        
# Message with Read Receipts
class MessageWithReadReceipts(Message):
    read_by: List[User] = []
    
# Delete Message Request
class DeleteMessageRequest(BaseModel):
    deletion_type: DeletionType = DeletionType.FOR_ME  # Default to personal deletion