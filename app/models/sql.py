from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.sql import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(255), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(String(50), default="regular")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    avatar_url = Column(String(512), nullable=True)
    bio = Column(String(500), nullable=True)
    phone_number = Column(String(50), nullable=True)
    status = Column(String(50), nullable=True)
    total_active_time = Column(Integer, default=0) # In seconds

    messages = relationship("Message", back_populates="sender")
    rooms_created = relationship("Room", back_populates="creator")
    memberships = relationship("RoomMember", back_populates="user")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255))
    description = Column(String(500), nullable=True)
    join_code = Column(String(20), unique=True, index=True, nullable=True)
    is_private = Column(Boolean, default=False)
    created_by = Column(String(36), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    max_members = Column(Integer, nullable=True)
    is_temporary = Column(Boolean, default=False)
    expires_at = Column(DateTime, nullable=True)
    last_activity = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", back_populates="rooms_created")
    messages = relationship("Message", back_populates="room")
    members = relationship("RoomMember", back_populates="room")

class RoomMember(Base):
    __tablename__ = "room_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    room_id = Column(String(36), ForeignKey("rooms.id"))
    user_id = Column(String(36), ForeignKey("users.id"))
    role = Column(String(50), default="member")
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_read_at = Column(DateTime, default=datetime.utcnow)
    is_muted = Column(Boolean, default=False)
    muted_until = Column(DateTime, nullable=True)

    room = relationship("Room", back_populates="members")
    user = relationship("User", back_populates="memberships")

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    room_id = Column(String(36), ForeignKey("rooms.id"))
    user_id = Column(String(36), ForeignKey("users.id"))
    content = Column(Text)
    message_type = Column(String(50), default="text")
    created_at = Column(DateTime, default=datetime.utcnow)
    edited_at = Column(DateTime, nullable=True)
    is_encrypted = Column(Boolean, default=False)
    
    room = relationship("Room", back_populates="messages")
    sender = relationship("User", back_populates="messages")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), unique=True, index=True)
    value = Column(Text) # Store as JSON string or simple string
    is_enabled = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

class HiddenMessage(Base):
    __tablename__ = "hidden_messages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    message_id = Column(String(36), ForeignKey("messages.id", ondelete="CASCADE"))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"))
    hidden_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    message = relationship("Message")
    user = relationship("User")

