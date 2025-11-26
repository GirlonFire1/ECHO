from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import urllib.parse
import os

# Database Configuration
# Supports both MySQL (local) and PostgreSQL (production/Render)
# Set DATABASE_URL environment variable for production

# Get database URL from environment or use MySQL default
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Local MySQL Configuration
    password = urllib.parse.quote_plus("Ankita@2003")
    DATABASE_URL = f"mysql+pymysql://root:{password}@localhost:3306/chat_app"

# Create engine with appropriate settings
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Handle connection drops
    pool_recycle=3600,   # Recycle connections after 1 hour
    pool_size=10,        # Connection pool size
    max_overflow=20      # Max overflow connections
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
