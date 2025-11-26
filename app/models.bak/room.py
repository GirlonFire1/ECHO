import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime, ForeignKey, Enum as SQLEnum

class RoomMemberRole(str, Enum):
    ADMIN = "admin"
    MEMBER = "member"

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base

class Room(Base):
    __tablename__ = "rooms"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    is_private = Column(Boolean, default=False)
    created_by = Column(String, ForeignKey("users.id"))
    max_members = Column(Integer, nullable=True)
    is_temporary = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    creator = relationship("User", back_populates="rooms_created")
    members = relationship("RoomMember", back_populates="room")
    messages = relationship("Message", back_populates="room")

class RoomMember(Base):
    __tablename__ = "room_members"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    room_id = Column(String, ForeignKey("rooms.id"), index=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    is_muted = Column(Boolean, default=False)
    muted_until = Column(DateTime(timezone=True), nullable=True)
    role = Column(SQLEnum(RoomMemberRole), default=RoomMemberRole.MEMBER, nullable=False)

    # Relationships
    user = relationship("User", back_populates="room_memberships")
    room = relationship("Room", back_populates="members") 