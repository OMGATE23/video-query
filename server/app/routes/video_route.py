from fastapi import APIRouter, UploadFile, File, HTTPException
from app.controllers.video_controller import process_video

router = APIRouter()

@router.post("/upload-video")
async def upload_video(file: UploadFile = File(...)):
    if file.content_type not in ["video/mp4", "video/mkv", "video/avi"]:
        raise HTTPException(status_code=400, detail="Invalid video format")
    return await process_video(file)
