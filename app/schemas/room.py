from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.schemas.user import User

# Shared properties
class RoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_private: bool = False
    max_members: Optional[int] = None
    is_temporary: bool = False
    expires_at: Optional[datetime] = None

# Properties to receive on room creation
class RoomCreate(RoomBase):
    name: str = Field(..., min_length=3, max_length=50)

# Properties to receive on room update
class RoomUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=50)
    description: Optional[str] = None
    is_private: Optional[bool] = None
    max_members: Optional[int] = None
    is_temporary: Optional[bool] = None
    expires_at: Optional[datetime] = None

# Properties shared by models stored in DB
class RoomInDBBase(RoomBase):
    id: str
    created_by: str
    created_at: datetime
    join_code: Optional[str] = None

    class Config:
        from_attributes = True

# Properties to return to client
class Room(RoomInDBBase):
    creator: Optional[User] = None
    member_count: int = 0

# Room with members list
class RoomWithMembers(Room):
    members: List[User] = []

# Room Member
class RoomMember(BaseModel):
    id: str
    user_id: str
    room_id: str
    joined_at: datetime
    role: str
    is_muted: bool
    muted_until: Optional[datetime] = None
    user: Optional[User] = None

    class Config:
        from_attributes = True

# Properties for transferring ownership
class RoomOwnershipTransfer(BaseModel):
    new_owner_id: str

# Properties for creating a DM
class DMCreate(BaseModel):
    target_user_id: str