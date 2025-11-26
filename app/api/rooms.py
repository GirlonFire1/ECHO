import random
import string
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.sql import get_db
from app.core.security import get_current_active_user, is_room_admin
from app.schemas.room import RoomCreate, RoomUpdate, RoomWithMembers, RoomOwnershipTransfer, Room as RoomSchema, DMCreate
from app.models.sql import Room as RoomModel, RoomMember as RoomMemberModel, User as UserModel
from app.core.websocket_manager import manager

router = APIRouter()

def generate_join_code():
    """Generates a 9-digit code."""
    return ''.join(random.choices(string.digits, k=9))

@router.post("/dm", response_model=RoomSchema)
async def create_dm(
    dm_in: DMCreate,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create or get existing Direct Message (DM) room"""
    target_user_id = dm_in.target_user_id
    
    if target_user_id == str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create DM with yourself"
        )
        
    target_user = db.query(UserModel).filter(UserModel.id == target_user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found"
        )

    # 1. Check if a private room exists with EXACTLY these two members
    # Find rooms where current user is a member
    my_rooms = db.query(RoomMemberModel.room_id).filter(
        RoomMemberModel.user_id == current_user.id
    ).subquery()

    # Find rooms where target user is a member
    target_rooms = db.query(RoomMemberModel.room_id).filter(
        RoomMemberModel.user_id == target_user_id
    ).subquery()

    # Find common rooms
    common_rooms = db.query(RoomModel).filter(
        RoomModel.id.in_(my_rooms),
        RoomModel.id.in_(target_rooms),
        RoomModel.is_private == True
    ).all()

    for room in common_rooms:
        # Check member count is exactly 2
        member_count = db.query(RoomMemberModel).filter(RoomMemberModel.room_id == room.id).count()
        if member_count == 2:
            return room

    # 2. If not found, create new private room
    join_code = generate_join_code()
    while db.query(RoomModel).filter(RoomModel.join_code == join_code).first():
        join_code = generate_join_code()

    room = RoomModel(
        name=f"DM: {current_user.username} & {target_user.username}", # Internal name, UI can override
        description="Direct Message",
        is_private=True,
        created_by=current_user.id,
        max_members=2,
        join_code=join_code
    )
    
    db.add(room)
    db.commit()
    db.refresh(room)
    
    # Add both users
    member1 = RoomMemberModel(user_id=current_user.id, room_id=room.id, role="admin")
    member2 = RoomMemberModel(user_id=target_user_id, room_id=room.id, role="admin")
    
    db.add(member1)
    db.add(member2)
    db.commit()
    
    return room

@router.post("/", response_model=RoomSchema)
async def create_room(
    room_in: RoomCreate,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new chat room"""
    # Generate a unique join code
    join_code = generate_join_code()
    while db.query(RoomModel).filter(RoomModel.join_code == join_code).first():
        join_code = generate_join_code()
        
    room = RoomModel(
        name=room_in.name,
        description=room_in.description,
        is_private=room_in.is_private,
        created_by=current_user.id,
        max_members=room_in.max_members,
        is_temporary=room_in.is_temporary,
        expires_at=room_in.expires_at,
        join_code=join_code
    )
    
    db.add(room)
    db.commit()
    db.refresh(room)
    
    # Add creator as a member
    room_member = RoomMemberModel(
        user_id=current_user.id,
        room_id=room.id,
        role="admin"
    )
    db.add(room_member)
    db.commit()
    
    return room

@router.get("/", response_model=List[RoomSchema])
async def read_rooms(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    is_private: bool = None,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get list of rooms with optional filtering"""
    query = db.query(RoomModel)

    # Privacy filter
    if is_private is not None:
        query = query.filter(RoomModel.is_private == is_private)
    else:
        # Show ONLY rooms where user is a member
        user_room_ids = [m.room_id for m in db.query(RoomMemberModel).filter(RoomMemberModel.user_id == current_user.id).all()]
        
        query = query.filter(RoomModel.id.in_(user_room_ids))

    # Search filter
    if search:
        query = query.filter(
            or_(
                RoomModel.name.ilike(f"%{search}%"),
                RoomModel.description.ilike(f"%{search}%")
            )
        )
    
    rooms = query.offset(skip).limit(limit).all()
    
    # Populate member_count manually
    for room in rooms:
        room.member_count = len(room.members)
    
    return rooms

@router.get("/{room_id}", response_model=RoomWithMembers)
async def read_room(
    room_id: str,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific room with member list"""
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Check if room is private and user is a member
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
    
    members = [m.user for m in room.members]
    creator = room.creator
    
    response_data = {
        "id": room.id,
        "name": room.name,
        "description": room.description,
        "join_code": room.join_code,
        "is_private": room.is_private,
        "created_by": room.created_by,
        "created_at": room.created_at,
        "max_members": room.max_members,
        "is_temporary": room.is_temporary,
        "expires_at": room.expires_at,
        "creator": creator,
        "member_count": len(members),
        "members": members
    }
    
    return response_data

@router.put("/{room_id}", response_model=RoomSchema)
async def update_room(
    room_id: str,
    room_in: RoomUpdate,
    admin_member: RoomMemberModel = Depends(is_room_admin),
    db: Session = Depends(get_db)
):
    """Update a room (room admin only)"""
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    if room_in.name:
        room.name = room_in.name
    if room_in.description:
        room.description = room_in.description
    if room_in.is_private is not None:
        room.is_private = room_in.is_private
    
    db.commit()
    db.refresh(room)
    return room

@router.delete("/{room_id}")
async def delete_room(
    room_id: str,
    admin_member: RoomMemberModel = Depends(is_room_admin),
    db: Session = Depends(get_db)
):
    """Delete a room (owner or admin only)"""
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Delete members first (cascade usually handles this but being explicit is safe)
    db.query(RoomMemberModel).filter(RoomMemberModel.room_id == room_id).delete()
    db.delete(room)
    db.commit()
    
    return {"message": "Room deleted successfully"}

@router.post("/{room_id}/join")
async def join_room(
    room_id: str,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Join a chat room"""
    room = db.query(RoomModel).filter(RoomModel.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Check if already a member
    member = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
        RoomMemberModel.user_id == current_user.id
    ).first()
    
    if member:
        return {"message": "You are already a member of this room"}
    
    # Check member limit
    if room.max_members:
        member_count = db.query(RoomMemberModel).filter(RoomMemberModel.room_id == room_id).count()
        if member_count >= room.max_members:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Room is full"
            )
    
    # Add user as member
    new_member = RoomMemberModel(
        user_id=current_user.id,
        room_id=room_id,
        role="member"
    )
    db.add(new_member)
    db.commit()
    
    return {"message": "Successfully joined room"}

@router.post("/join/{join_code}")
async def join_room_by_code(
    join_code: str,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Join a chat room using a join code"""
    room = db.query(RoomModel).filter(RoomModel.join_code == join_code).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Check if already a member
    member = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room.id,
        RoomMemberModel.user_id == current_user.id
    ).first()
    
    if member:
        return {"message": "You are already a member of this room"}
    
    # Check member limit
    if room.max_members:
        member_count = db.query(RoomMemberModel).filter(RoomMemberModel.room_id == room.id).count()
        if member_count >= room.max_members:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Room is full"
            )
    
    # Add user as member
    new_member = RoomMemberModel(
        user_id=current_user.id,
        room_id=room.id,
        role="member"
    )
    db.add(new_member)
    db.commit()
    
    return {"message": "Successfully joined room"}

@router.post("/{room_id}/leave")
async def leave_room(
    room_id: str,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Leave a chat room"""
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
        return {"message": "You are not a member of this room"}
    
    if room.created_by == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room creator cannot leave. Delete the room instead."
        )
    
    db.delete(member)
    db.commit()
    
    return {"message": "Successfully left room"}

@router.post("/{room_id}/members/{user_id}/promote", status_code=status.HTTP_200_OK)
async def promote_member_to_admin(
    room_id: str,
    user_id: str,
    admin_member: RoomMemberModel = Depends(is_room_admin),
    db: Session = Depends(get_db)
):
    """Promote a room member to admin."""
    if str(admin_member.user_id) == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change your own role.")

    member_to_promote = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
        RoomMemberModel.user_id == user_id
    ).first()

    if not member_to_promote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this room.")

    member_to_promote.role = "admin"
    db.commit()
    return {"message": "User promoted to admin."}

@router.post("/{room_id}/members/{user_id}/demote", status_code=status.HTTP_200_OK)
async def demote_admin_to_member(
    room_id: str,
    user_id: str,
    admin_member: RoomMemberModel = Depends(is_room_admin),
    db: Session = Depends(get_db)
):
    """Demote a room admin to member."""
    if str(admin_member.user_id) == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change your own role.")

    member_to_demote = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
        RoomMemberModel.user_id == user_id
    ).first()

    if not member_to_demote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this room.")

    member_to_demote.role = "member"
    db.commit()
    return {"message": "Admin demoted to member."}

@router.delete("/{room_id}/members/{user_id}", status_code=status.HTTP_200_OK)
async def remove_member(
    room_id: str,
    user_id: str,
    admin_member: RoomMemberModel = Depends(is_room_admin),
    db: Session = Depends(get_db)
):
    """Remove a member from a room."""
    if str(admin_member.user_id) == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot remove yourself.")

    member_to_remove = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
        RoomMemberModel.user_id == user_id
    ).first()

    if not member_to_remove:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found in this room.")

    db.delete(member_to_remove)
    db.commit()
    
    # Disconnect the user if they are online
    if user_id in manager.user_connections and room_id in manager.user_connections[user_id]:
        websocket = manager.user_connections[user_id][room_id]
        await websocket.close(code=status.WS_1000_NORMAL_CLOSURE, reason="Removed from room by admin")
        manager.disconnect(websocket, room_id, user_id)

    return {"message": "Member removed from the room."}

@router.post("/{room_id}/transfer-ownership", status_code=status.HTTP_200_OK)
async def transfer_ownership(
    room_id: str,
    transfer_request: RoomOwnershipTransfer,
    admin_member: RoomMemberModel = Depends(is_room_admin),
    db: Session = Depends(get_db)
):
    """Transfer room admin rights to another member."""
    new_owner_id = transfer_request.new_owner_id

    if str(admin_member.user_id) == new_owner_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already the owner.")

    new_owner_member = db.query(RoomMemberModel).filter(
        RoomMemberModel.room_id == room_id,
        RoomMemberModel.user_id == new_owner_id
    ).first()

    if not new_owner_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="New owner is not a member of this room.")

    # Promote the new owner to admin
    new_owner_member.role = "admin"
    
    # Demote the old owner to member
    admin_member.role = "member"
    
    db.commit()

    return {"message": f"Ownership successfully transferred to user {new_owner_id}."}