from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query, Body
from datetime import datetime
import json
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.sql import get_db
from app.core.security import get_current_active_user, is_moderator_or_admin, is_admin
from app.core.moderation import profanity_filter, rate_limiter
from app.schemas.message import (
    MessageCreate, MessageUpdate, 
    MessageWithReactions, MessageReportCreate, 
    BroadcastMessageCreate, DeleteMessageRequest,
    MessageWithReadReceipts,
    MessageType, DeletionType,
    Message as MessageSchema,
    MessageReaction as MessageReactionSchema,
    MessageReport as MessageReportSchema,
    MessageReadReceipt as MessageReadReceiptSchema
)
from app.models.sql import (
    Message as MessageModel, 
    Room as RoomModel, RoomMember as RoomMemberModel,
    User as UserModel
)
from app.config import settings
from app.core.websocket_manager import manager

router = APIRouter()

# Background task to deliver scheduled messages - Simplified for SQL
async def deliver_scheduled_message(message_id: str, db: Session):
    pass

@router.get("/rooms/{room_id}/messages", response_model=List[MessageSchema])
async def read_messages(
    room_id: str,
    skip: int = 0,
    limit: int = 100,
    before_timestamp: Optional[datetime] = None,
    after_timestamp: Optional[datetime] = None,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get messages in a room with pagination"""
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    if room.is_private:
        member = db.query(RoomMemberModel).filter(
            RoomMemberModel.room_id == room_id,
            RoomMemberModel.user_id == current_user.id
        ).first()
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this private room"
            )
            
    query = db.query(MessageModel).filter(MessageModel.room_id == room_id)
    
    if before_timestamp:
        query = query.filter(MessageModel.created_at < before_timestamp)
    if after_timestamp:
        query = query.filter(MessageModel.created_at > after_timestamp)
        
    messages = query.order_by(desc(MessageModel.created_at)).offset(skip).limit(limit).all()
    
    return messages

@router.post("/rooms/{room_id}/messages", response_model=MessageSchema)
async def create_message(
    room_id: str,
    message_in: MessageCreate,
    background_tasks: BackgroundTasks,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new message in a room"""
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    member = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
        RoomMemberModel.user_id == current_user.id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this room"
        )
        
    # Check rate limiting
    if not rate_limiter.check_rate_limit(current_user.id, settings.RATE_LIMIT_MESSAGES_PER_MINUTE):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {settings.RATE_LIMIT_MESSAGES_PER_MINUTE} messages per minute."
        )
    
    is_encrypted = message_in.message_type == MessageType.ENCRYPTED
    content = message_in.content
    
    if not is_encrypted:
        if len(content) > settings.MAX_MESSAGE_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Message too long. Maximum {settings.MAX_MESSAGE_LENGTH} characters allowed."
            )
        
        if profanity_filter.contains_profanity(content):
            content = profanity_filter.censor_text(content)
            
    message = MessageModel(
        content=content,
        user_id=current_user.id,
        room_id=room_id,
        message_type=message_in.message_type,
        is_encrypted=is_encrypted,
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    msg_data = {
        "type": "message",
        "message_id": str(message.id),
        "content": content,
        "user_id": str(current_user.id),
        "message_type": message_in.message_type,
        "created_at": message.created_at.isoformat(),
        "is_encrypted": is_encrypted
    }
    
    await manager.broadcast_to_room(
        room_id=room_id,
        message=msg_data
    )
    
    return message

@router.put("/messages/{message_id}", response_model=MessageSchema)
async def update_message(
    message_id: str,
    message_in: MessageUpdate,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a message (owner only)"""
    message = db.query(MessageModel).filter(MessageModel.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    if message.user_id != current_user.id:
        if current_user.role not in ["admin", "moderator"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to edit this message"
            )
            
    content = message_in.content
    if len(content) > settings.MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Message too long. Maximum {settings.MAX_MESSAGE_LENGTH} characters allowed."
        )
    
    if profanity_filter.contains_profanity(content):
        content = profanity_filter.censor_text(content)
        
    message.content = content
    message.edited_at = datetime.utcnow()
    db.commit()
    db.refresh(message)
    
    await manager.broadcast_to_room(
        room_id=str(message.room_id),
        message={
            "type": "message_updated",
            "message_id": str(message.id),
            "content": message.content,
            "edited_at": message.edited_at.isoformat()
        }
    )
    
    return message

@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: str,
    deletion_request: DeleteMessageRequest = Body(None),
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a message"""
    message = db.query(MessageModel).filter(MessageModel.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    deletion_type = deletion_request.deletion_type if deletion_request else DeletionType.FOR_ME
    
    is_admin_or_mod = current_user.role in ["admin", "moderator"]
    is_owner = str(message.user_id) == str(current_user.id)
    
    if deletion_type == DeletionType.FOR_EVERYONE and not (is_owner or is_admin_or_mod):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this message for everyone"
        )
    
    if deletion_type == DeletionType.FOR_ME:
        await manager.send_personal_message(
            user_id=str(current_user.id),
            room_id=str(message.room_id),
            message={
                "type": "message_deleted",
                "message_id": message_id,
                "deletion_type": str(deletion_type)
            }
        )
    else: # FOR_EVERYONE
        db.delete(message)
        db.commit()
        
        await manager.notify_message_deleted(
            room_id=str(message.room_id),
            message_id=message_id,
            deletion_type=str(deletion_type),
            deleted_by=str(current_user.id)
        )
    
    return {"message": "Message deleted successfully", "deletion_type": str(deletion_type)}