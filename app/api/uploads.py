from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
import os
import uuid
import aiofiles
from app.core.security import get_current_active_user, User
from app.config import settings

router = APIRouter()

@router.post("/")
async def upload_file(file: UploadFile = File(...), current_user: User = Depends(get_current_active_user)):
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File type {file.content_type} not allowed.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Generate a unique filename to avoid overwrites
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    try:
        async with aiofiles.open(file_path, "wb") as out_file:
            while content := await file.read(1024 * 1024):
                await out_file.write(content)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error uploading file: {e}")

    return {"file_url": f"/uploads/{unique_filename}"}
