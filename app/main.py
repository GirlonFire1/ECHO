import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
from sqlalchemy.orm import Session

from app.config import settings
from app.database.sql import engine, Base, get_db, SessionLocal
from app.core.security import get_password_hash
from app.models.sql import User

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://echo-ex3m.onrender.com",
        os.getenv("FRONTEND_URL", ""),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

from app.api import auth, users, rooms, messages, websocket, uploads, admin

app.include_router(auth.router, prefix=f"{settings.API_PREFIX}/auth", tags=["auth"])
app.include_router(users.router, prefix=f"{settings.API_PREFIX}/users", tags=["users"])
app.include_router(rooms.router, prefix=f"{settings.API_PREFIX}/rooms", tags=["rooms"])
app.include_router(messages.router, prefix=f"{settings.API_PREFIX}/messages", tags=["messages"])
app.include_router(websocket.router, tags=["websocket"])
app.include_router(uploads.router, prefix=f"{settings.API_PREFIX}/uploads", tags=["uploads"])
app.include_router(admin.router, prefix=f"{settings.API_PREFIX}/admin", tags=["admin"])


@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


@app.on_event("startup")
def create_admin_on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            hashed_password = get_password_hash("adminpassword")
            new_admin = User(
                username="admin",
                email="admin@example.com",
                password_hash=hashed_password,
                is_active=True,
                role="admin"
            )
            db.add(new_admin)
            db.commit()
    finally:
        db.close()
