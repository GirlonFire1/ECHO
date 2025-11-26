from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import os
import uuid
import aiofiles
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.sql import get_db
from app.models.sql import User as UserModel
from app.schemas.user import User as UserSchema, UserUpdate, UserStatusUpdate
from app.core.security import (
    get_current_active_user,
    get_password_hash,
    is_admin,
)
from app.config import settings

router = APIRouter()

@router.put("/me/status", response_model=UserSchema)
async def update_current_user_status(
    status_in: UserStatusUpdate,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's status"""
    current_user.status = status_in.status
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me", response_model=UserSchema)
async def read_current_user(
    current_user: UserModel = Depends(get_current_active_user)
):
    """Get current user profile"""
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_current_user(
    user_in: UserUpdate,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    
    # Check if email is already taken
    if user_in.email and user_in.email != current_user.email:
        if db.query(UserModel).filter(UserModel.email == user_in.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Check if username is already taken
    if user_in.username and user_in.username != current_user.username:
        if db.query(UserModel).filter(UserModel.username == user_in.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

    # Check if phone number is already taken
    if user_in.phone_number and user_in.phone_number != current_user.phone_number:
        if db.query(UserModel).filter(UserModel.phone_number == user_in.phone_number).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
    
    # Update fields
    db.commit()
    db.refresh(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete current user account"""
    if current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot delete their own account."
        )
    
    # Delete user
    db.delete(current_user)
    db.commit()
    return None

@router.get("/{user_id}", response_model=UserSchema)
async def read_user(
    user_id: str,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user by ID"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.post("/upload-avatar", response_model=UserSchema)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload user avatar"""
    # Validate file type
    if file.content_type not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not allowed."
        )
    
    # Check upload directory exists, create if not
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"avatar_{current_user.id}_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    # Save file
    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)
    
    # Update user's avatar URL in the database
    avatar_url = f"/uploads/{unique_filename}"
    current_user.avatar_url = avatar_url
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.get("/", response_model=List[UserSchema])
async def read_users(
    search: str,
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get list of users by email or phone number"""
    users = db.query(UserModel).filter(
        or_(
            UserModel.email.ilike(f"%{search}%"),
            UserModel.phone_number.ilike(f"%{search}%"),
            UserModel.username.ilike(f"%{search}%")
        )
    ).offset(skip).limit(limit).all()
    
    return users

@router.put("/{user_id}/role", response_model=UserSchema)
async def update_user_role(
    user_id: str,
    role: str, # Role is now a string
    current_user: UserModel = Depends(is_admin),  # Only admins can change roles
    db: Session = Depends(get_db)
):
    """Update user role (admin only)"""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.role = role
    db.commit()
    db.refresh(user)
    
    return user