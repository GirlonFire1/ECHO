
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status, Depends
from sqlalchemy.orm import Session
from typing import Optional
from jose import jwt, JWTError
from datetime import datetime
import json
import asyncio

from app.core.moderation import profanity_filter, rate_limiter
from app.schemas.message import MessageType
from app.models.sql import User as UserModel, Room as RoomModel, RoomMember as RoomMemberModel, Message as MessageModel, SystemSetting
from app.config import settings
from app.database.sql import get_db
from app.schemas.token import TokenPayload
from app.core.websocket_manager import manager

router = APIRouter()

# Authenticate WebSocket connection
def get_token_user(token: str, db: Session) -> Optional[UserModel]:
    """Authenticate WebSocket connection using token"""
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_data = TokenPayload(**payload)
        if datetime.fromtimestamp(token_data.exp) < datetime.now():
            return None
    except:
        return None
    
    user = db.query(UserModel).filter(UserModel.id == token_data.sub).first()
    
    if not user or not user.is_active:
        return None
    
    # Update last seen
    user.last_seen = datetime.utcnow()
    db.commit()
    
    return user

@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: str = Query(...),
):
    """WebSocket endpoint for real-time chat in a room"""
    # Get a database session
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        # Authenticate user
        user = get_token_user(token, db)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Check room exists
        room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
        if not room:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Check if user is a member of the room (required for private rooms)
        if room.is_private:
            member = db.query(RoomMemberModel).filter(
                RoomMemberModel.room_id == room_id,
                RoomMemberModel.user_id == user.id
            ).first()
            if not member:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        
        # Accept connection
        await manager.connect(websocket, room_id, str(user.id))
        
        # Track session start time
        session_start_time = datetime.utcnow()
        
        try:
            while True:
                # Check if communications are paused
                comms_setting = db.query(SystemSetting).filter(SystemSetting.name == "communications_paused").first()
                if comms_setting and comms_setting.value == "true":
                    await websocket.send_json({
                        "type": "error",
                        "message": "Communications are temporarily paused by an administrator."
                    })
                    data = await websocket.receive_text()
                    continue

                # Receive message from WebSocket
                data = await websocket.receive_text()
                
                try:
                    message_data = json.loads(data)
                    
                    # Handle different types of WebSocket messages
                    if "type" in message_data:
                        # Typing status update
                        if message_data["type"] == "typing":
                            is_typing = message_data.get("is_typing", False)
                            await manager.set_typing_status(room_id, str(user.id), is_typing)
                        
                        # New message
                        elif message_data["type"] == "message":
                            if not rate_limiter.check_rate_limit(str(user.id), settings.RATE_LIMIT_MESSAGES_PER_MINUTE):
                                await websocket.send_json({
                                    "type": "error",
                                    "message": f"Rate limit exceeded. Maximum {settings.RATE_LIMIT_MESSAGES_PER_MINUTE} messages per minute."
                                })
                                continue
                            
                            content = message_data.get("content", "")
                            
                            is_encrypted = message_data.get("is_encrypted", False)
                            incoming_type = message_data.get("message_type", "text")
                            
                            if is_encrypted:
                                message_type = MessageType.ENCRYPTED
                            elif incoming_type in ["image", "file", "video", "audio"]:
                                message_type = incoming_type
                            else:
                                message_type = MessageType.TEXT
                            
                            if not is_encrypted and message_type == MessageType.TEXT:
                                if len(content) > settings.MAX_MESSAGE_LENGTH:
                                    await websocket.send_json({
                                        "type": "error",
                                        "message": f"Message too long. Maximum {settings.MAX_MESSAGE_LENGTH} characters allowed."
                                    })
                                    continue
                                
                                if profanity_filter.contains_profanity(content):
                                    content = profanity_filter.censor_text(content)
                            
                            message = MessageModel(
                                content=content,
                                user_id=user.id,
                                room_id=room_id,
                                message_type=message_type,
                                is_encrypted=is_encrypted,
                            )
                            db.add(message)
                            db.commit()
                            db.refresh(message)
                            
                            msg_data = {
                                "type": "message",
                                "message_id": str(message.id),
                                "content": content,
                                "user_id": str(user.id),
                                "sender_name": user.username,
                                "user": {
                                    "id": str(user.id),
                                    "username": user.username,
                                    "avatar_url": user.avatar_url
                                },
                                "message_type": message_type,
                                "created_at": message.created_at.isoformat(),
                                "is_encrypted": is_encrypted
                            }
                                
                            await manager.broadcast_to_room(
                                room_id=room_id,
                                message=msg_data
                            )
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid message format"
                    })
                except Exception as e:
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e)
                    })
        
        except WebSocketDisconnect:
            # Calculate session duration
            session_duration = (datetime.utcnow() - session_start_time).total_seconds()
            
            # Update user's total active time
            try:
                # Re-fetch user to ensure attached to session
                db_user = db.query(UserModel).filter(UserModel.id == user.id).first()
                if db_user:
                    db_user.total_active_time = (db_user.total_active_time or 0) + int(session_duration)
                    db_user.last_seen = datetime.utcnow()
                    db.commit()
            except Exception as e:
                print(f"Error updating session time: {e}")

            manager.disconnect(websocket, room_id, str(user.id))
            await manager.broadcast_to_room(
                room_id=room_id,
                message={"type": "user_left", "user_id": str(user.id)}
            )
    finally:
        db.close()
