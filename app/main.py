import os
from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from sqlalchemy.orm import Session

# Import API modules one by one to isolate the issue
from app.config import settings
# from app.database.mongodb import mongodb # Removed
from app.database.sql import engine, Base, get_db, SessionLocal
from app.core.security import get_password_hash
from app.models.sql import User # SQL Model

# Create directories if they don't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Initialize FastAPI app
app = FastAPI(title=settings.APP_NAME)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://echo-ex3m.onrender.com", # Production frontend URL
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Import routers individually to isolate the issue
from app.api import auth
from app.api import users
from app.api import rooms
from app.api import messages
from app.api import websocket
from app.api import uploads
from app.api import admin

# Include API routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["authentication"]
)
app.include_router(
    users.router,
    prefix=f"{settings.API_V1_STR}/users",
    tags=["users"]
)
app.include_router(
    rooms.router,
    prefix=f"{settings.API_V1_STR}/rooms",
    tags=["rooms"]
)
app.include_router(
    messages.router,
    prefix=f"{settings.API_V1_STR}/messages",
    tags=["messages"]
)
app.include_router(
    websocket.router,
    tags=["websocket"]
)
app.include_router(
    uploads.router,
    prefix=f"{settings.API_V1_STR}/uploads",
    tags=["uploads"]
)
app.include_router(
    admin.router,
    prefix=f"{settings.API_V1_STR}/admin",
    tags=["admin"]
)

# Root endpoint
@app.get("/")
async def root():
    return {
        "app_name": settings.APP_NAME,
        "api_version": "1.0.0",
        "docs_url": "/docs"
    }

# Health check endpoint
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.on_event("startup")
async def startup_db_client():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Create a default admin user if one doesn't exist
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            new_admin = User(
                username="admin",
                email="admin@example.com",
                password_hash=get_password_hash("adminpassword"),
                role="admin"
            )
            db.add(new_admin)
            db.commit()
            db.add(new_admin)
            db.commit()
            print("Default admin user created.")
            
    finally:
        db.close()

@app.on_event("shutdown")
async def shutdown_db_client():
    pass