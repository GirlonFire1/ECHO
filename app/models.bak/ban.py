import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base

class UserBan(Base):
    __tablename__ = "user_bans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    room_id = Column(String, ForeignKey("rooms.id"), nullable=True, index=True)  # Null for global ban
    banned_by = Column(String, ForeignKey("users.id"))
    reason = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Null for permanent ban
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="bans")
    admin = relationship("User", foreign_keys=[banned_by])
    room = relationship("Room") 