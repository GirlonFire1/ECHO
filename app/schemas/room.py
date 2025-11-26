from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.schemas.user import User

# Shared properties
class RoomBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_private: Optional[bool] = False
    max_members: Optional[int] = None
    is_temporary: Optional[bool] = False
    expires_at: Optional[datetime] = None

# Properties to receive via API on creation
class RoomCreate(RoomBase):
    name: str

# Properties to receive via API on update
class RoomUpdate(RoomBase):
    pass

# Properties shared by models stored in DB
class RoomInDBBase(RoomBase):
    id: str
    created_by: str
    created_at: datetime
    last_activity: Optional[datetime] = None
    join_code: Optional[str] = None

    class Config:
        from_attributes = True

class RoomMember(BaseModel):
    id: str
    user_id: Optional[str] = None # Made optional to handle deleted users
    room_id: str
    joined_at: datetime
    role: str
    is_muted: bool
    muted_until: Optional[datetime] = None
    last_read_at: Optional[datetime] = None
    user: Optional[User] = None

    class Config:
        from_attributes = True

# Properties to return to client
class Room(RoomInDBBase):
    has_unread: Optional[bool] = False
    members: List[RoomMember] = []

class RoomWithMembers(Room):
    pass

# Properties for transferring ownership
class RoomOwnershipTransfer(BaseModel):
    new_owner_id: str

# Properties for creating a DM
class DMCreate(BaseModel):
    target_user_id: str