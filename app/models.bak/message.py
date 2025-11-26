import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base

class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    FILE = "file"
    SYSTEM = "system"
    ENCRYPTED = "encrypted"
    BROADCAST = "broadcast"

class DeletionType(str, Enum):
    NOT_DELETED = "not_deleted"
    FOR_ME = "for_me"
    FOR_EVERYONE = "for_everyone"

class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    content = Column(Text)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    room_id = Column(String, ForeignKey("rooms.id"), index=True)
    message_type = Column(SQLEnum(MessageType), default=MessageType.TEXT)
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    edited_at = Column(DateTime(timezone=True), nullable=True)
    
    # E2E encryption fields
    is_encrypted = Column(Boolean, default=False)
    encryption_metadata = Column(Text, nullable=True)  # Stores key exchange info
    
    # Admin broadcast fields
    is_broadcast = Column(Boolean, default=False)
    broadcast_rooms = Column(JSON, nullable=True)  # List of room IDs for multi-room broadcasts
    
    # Deletion tracking
    deletion_type = Column(SQLEnum(DeletionType), default=DeletionType.NOT_DELETED)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="messages", foreign_keys=[user_id])
    room = relationship("Room", back_populates="messages")
    reactions = relationship("MessageReaction", back_populates="message")
    reports = relationship("MessageReport", back_populates="message")
    read_receipts = relationship("MessageReadReceipt", back_populates="message")
    deleter = relationship("User", foreign_keys=[deleted_by])

# Track who has read a message
class MessageReadReceipt(Base):
    __tablename__ = "message_read_receipts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String, ForeignKey("messages.id"), index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    read_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    message = relationship("Message", back_populates="read_receipts")
    user = relationship("User")

# Track who a message is deleted for (in FOR_ME deletion mode)
class MessageDeletion(Base):
    __tablename__ = "message_deletions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String, ForeignKey("messages.id"), index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    deleted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    message = relationship("Message")
    user = relationship("User")

class MessageReaction(Base):
    __tablename__ = "message_reactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String, ForeignKey("messages.id"), index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    emoji = Column(String(10))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    message = relationship("Message", back_populates="reactions")
    user = relationship("User", back_populates="reactions")

class MessageReport(Base):
    __tablename__ = "message_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String, ForeignKey("messages.id"), index=True)
    reporter_id = Column(String, ForeignKey("users.id"), index=True)
    reason = Column(Text)
    is_resolved = Column(String(1), default="0")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    message = relationship("Message", back_populates="reports")
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports_created") 