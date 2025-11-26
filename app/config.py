import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Base settings
    APP_NAME: str = "FastAPI Chat Room"
    API_V1_STR: str = "/api/v1"
    
    # Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # MongoDB
    MONGO_CONNECTION_STRING: str = os.getenv("MONGO_CONNECTION_STRING", "mongodb://localhost:27017/")
    MONGO_DATABASE_NAME: str = os.getenv("MONGO_DATABASE_NAME", "chatroom_db")
    
    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    
    # Moderation
    RATE_LIMIT_MESSAGES_PER_MINUTE: int = 60
    MAX_MESSAGE_LENGTH: int = 2000
import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Base settings
    APP_NAME: str = "FastAPI Chat Room"
    API_V1_STR: str = "/api/v1"
    
    # Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # MongoDB
    MONGO_CONNECTION_STRING: str = os.getenv("MONGO_CONNECTION_STRING", "mongodb://localhost:27017/")
    MONGO_DATABASE_NAME: str = os.getenv("MONGO_DATABASE_NAME", "chatroom_db")
    
    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD")
    
    # Moderation
    RATE_LIMIT_MESSAGES_PER_MINUTE: int = 60
    MAX_MESSAGE_LENGTH: int = 2000
    
    # File uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_FILE_TYPES: list = ["image/jpeg", "image/png", "image/gif", "application/pdf"]

    class Config:
        env_file = ".env"

settings = Settings()