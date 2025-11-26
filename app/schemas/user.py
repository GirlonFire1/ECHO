from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    REGULAR = "regular"
    MODERATOR = "moderator"
    ADMIN = "admin"

# Shared properties
class UserBase(BaseModel):
    username: str
    email: EmailStr
    avatar_url: Optional[str] = None
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None
    
# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v


# Properties to receive via API on update
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    phone_number: Optional[str] = None
    status: Optional[str] = None
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if v is not None and not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

class UserStatusUpdate(BaseModel):
    status: str

# Properties to return to client
class User(UserBase):
    id: str
    role: str
    is_active: bool
    created_at: datetime
    last_seen: datetime

    class Config:
        from_attributes = True