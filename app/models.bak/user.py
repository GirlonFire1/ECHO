import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base

class UserRole(str, Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    bio = Column(Text, nullable=True)
    password_hash = Column(String)
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    rooms_created = relationship("Room", back_populates="creator")
    room_memberships = relationship("RoomMember", back_populates="user")
    messages = relationship("Message", back_populates="user")
    reactions = relationship("MessageReaction", back_populates="user")
    bans = relationship("UserBan", back_populates="user")
    reports_created = relationship("MessageReport", foreign_keys="MessageReport.reporter_id", back_populates="reporter") 