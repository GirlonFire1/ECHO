from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List

from app.database.sql import get_db
from app.core.security import is_admin, User
from app.models.sql import User as UserModel, Room as RoomModel, Message as MessageModel, RoomMember as RoomMemberModel, SystemSetting

router = APIRouter()


@router.post("/pause-communications", status_code=status.HTTP_200_OK)
async def pause_communications(current_user: User = Depends(is_admin), db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter(SystemSetting.name == "communications_paused").first()
    if not setting:
        setting = SystemSetting(name="communications_paused", value="true", is_enabled=True)
        db.add(setting)
    else:
        setting.value = "true"
    db.commit()
    return {"message": "All communications have been paused."}


@router.post("/resume-communications", status_code=status.HTTP_200_OK)
async def resume_communications(current_user: User = Depends(is_admin), db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter(SystemSetting.name == "communications_paused").first()
    if not setting:
        setting = SystemSetting(name="communications_paused", value="false", is_enabled=True)
        db.add(setting)
    else:
        setting.value = "false"
    db.commit()
    return {"message": "All communications have been resumed."}


@router.get("/communications-status")
async def get_communications_status(current_user: User = Depends(is_admin), db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter(SystemSetting.name == "communications_paused").first()
    is_paused = setting.value == "true" if setting else False
    return {"is_paused": is_paused}


@router.get("/stats")
async def get_stats(current_user: User = Depends(is_admin), db: Session = Depends(get_db)):
    total_users = db.query(UserModel).count()
    new_users_24h = db.query(UserModel).filter(UserModel.created_at >= datetime.utcnow() - timedelta(days=1)).count()
    active_rooms = db.query(RoomModel).count()
    total_messages = db.query(MessageModel).count()

    avg_active_seconds = db.query(func.avg(UserModel.total_active_time)).scalar() or 0
    avg_active_minutes = round(avg_active_seconds / 60, 1)

    return {
        "total_users": total_users,
        "new_users_24h": new_users_24h,
        "active_rooms": active_rooms,
        "total_messages": total_messages,
        "avg_active_minutes": avg_active_minutes
    }


@router.get("/user-growth")
async def get_user_growth(current_user: User = Depends(is_admin), db: Session = Depends(get_db)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    results = db.query(
        func.date(UserModel.created_at).label("date"),
        func.count(UserModel.id).label("count")
    ).filter(
        UserModel.created_at >= thirty_days_ago
    ).group_by(
        func.date(UserModel.created_at)
    ).all()

    return [{"_id": str(r.date), "count": r.count} for r in results]


@router.get("/message-volume")
async def get_message_volume(current_user: User = Depends(is_admin), db: Session = Depends(get_db)):
    seven_days_ago = datetime.utcnow() - timedelta(days=7)

    results = db.query(
        func.date(MessageModel.created_at).label("date"),
        func.count(MessageModel.id).label("count")
    ).filter(
        MessageModel.created_at >= seven_days_ago
    ).group_by(
        func.date(MessageModel.created_at)
    ).all()

    return [{"date": str(r.date), "count": r.count} for r in results]


@router.get("/active-rooms")
async def get_active_rooms(current_user: User = Depends(is_admin), db: Session = Depends(get_db)):
    results = db.query(
        MessageModel.room_id,
        func.count(MessageModel.id).label("message_count")
    ).group_by(
        MessageModel.room_id
    ).order_by(
        desc("message_count")
    ).limit(5).all()

    active_rooms = []
    total_messages_in_top_rooms = sum(r.message_count for r in results)

    for r in results:
        room = db.query(RoomModel).filter(RoomModel.id == r.room_id).first()
        if room:
            percentage = round((r.message_count / total_messages_in_top_rooms) * 100) if total_messages_in_top_rooms > 0 else 0
            active_rooms.append({
                "name": room.name,
                "value": r.message_count,
                "percentage": percentage
            })

    return active_rooms


@router.get("/users")
async def get_all_users(skip: int = 0, limit: int = 100, current_user: User = Depends(is_admin), db: Session = Depends(get_db)):
    users = db.query(UserModel).offset(skip).limit(limit).all()
    return users


@router.put("/users/{user_id}/status")
async def update_user_status(user_id: str, is_active: bool, current_user: User = Depends(is_admin), db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = is_active
    db.commit()
    return {"message": f"User status updated to {'active' if is_active else 'inactive'}"}


@router.get("/rooms")
async def get_all_rooms(skip: int = 0, limit: int = 100, current_user: User = Depends(is_admin), db: Session = Depends(get_db)):
    # Filter out DM rooms
    rooms = db.query(RoomModel).filter(
        ~RoomModel.name.startswith("DM:")
    ).offset(skip).limit(limit).all()
    return rooms


@router.delete("/rooms/{room_id}")
async def delete_room(room_id: str, current_user: User = Depends(is_admin), db: Session = Depends(get_db)):
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    db.query(MessageModel).filter(MessageModel.room_id == room_id).delete()
    db.query(RoomMemberModel).filter(RoomMemberModel.room_id == room_id).delete()
    db.delete(room)
    db.commit()
    return {"message": "Room deleted successfully"}
