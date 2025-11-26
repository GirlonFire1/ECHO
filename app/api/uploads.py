from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
import os
import uuid
import aiofiles
from app.core.security import get_current_active_user, User
from app.config import settings

router = APIRouter()

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Handle file uploads and return the file URL."""
    # Basic validation for content type can be done here if needed
    # For example, limit to images and videos
    print(f"DEBUG: Uploading file with content_type: {file.content_type}")
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime"]
    if file.content_type not in allowed_types:
        print(f"DEBUG: File type {file.content_type} not allowed. Allowed: {allowed_types}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file.content_type} not allowed. Got {file.content_type}"
        )

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Generate a unique filename to prevent overwrites
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)

    # Save the file asynchronously
    try:
        async with aiofiles.open(file_path, "wb") as out_file:
            while content := await file.read(1024 * 1024):  # Read in 1MB chunks
                await out_file.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"There was an error uploading the file: {e}"
        )

    file_url = f"/uploads/{unique_filename}"
    return {"file_url": file_url}
