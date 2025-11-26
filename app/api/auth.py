from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database.sql import get_db
from app.models.sql import User as UserModel
from app.core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user,
    User # Keep this import for get_current_user dependency
)
from app.schemas.user import UserCreate
from app.schemas.token import Token
from app.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/register", response_model=Token) # Changed response model to Token to auto-login
async def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Registering user: {user_in.email}")
    
    # Check if user with this email already exists
    if db.query(UserModel).filter(UserModel.email == user_in.email).first():
        logger.warning(f"Email already registered: {user_in.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username is already taken
    if db.query(UserModel).filter(UserModel.username == user_in.username).first():
        logger.warning(f"Username already taken: {user_in.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Check if phone number is already taken
    if user_in.phone_number and db.query(UserModel).filter(UserModel.phone_number == user_in.phone_number).first():
        logger.warning(f"Phone number already registered: {user_in.phone_number}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered"
        )

    # Create new user
    user = UserModel(
        email=user_in.email,
        username=user_in.username,
        phone_number=user_in.phone_number,
        password_hash=get_password_hash(user_in.password),
        avatar_url=user_in.avatar_url
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    logger.info(f"User registered successfully: {user.id}")
    
    # Auto-login after registration
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    logger.info(f"Login attempt for user: {form_data.username}")
    # Find user by email or username
    user = db.query(UserModel).filter(
        or_(
            UserModel.email == form_data.username,
            UserModel.username == form_data.username
        )
    ).first()
    
    # Check if user exists and password is correct
    if not user or not verify_password(form_data.password, user.password_hash):
        logger.warning(f"Login failed for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        logger.warning(f"Inactive user attempted login: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=str(user.id), expires_delta=access_token_expires
    )
    
    # Update last seen
    user.last_seen = datetime.utcnow()
    db.commit()
    
    logger.info(f"Login successful for user: {form_data.username}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    # In a real-world scenario with refresh tokens, we would invalidate the token here
    # But with simple JWT, we just return success - client should remove the token
    logger.info(f"User logged out: {current_user.email}")
    return {"message": "Successfully logged out"}