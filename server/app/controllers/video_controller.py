import os
import uuid
from pathlib import Path
from fastapi import HTTPException
from app.controllers.utils import extract_screenshots, upload_to_supabase
from app.config import Config
from ollama import Client
import base64
import requests
from supabase import create_client
import shutil

async def process_video(file):
  try:
    SUPABASE_URL = Config.SUPABASE_URL
    SUPABASE_KEY = Config.SUPABASE_KEY
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    video_id = str(uuid.uuid4())
    video_path = Path(f"temp/{video_id}.mp4")
    screenshots_dir = Path(f"temp/screenshots/{video_id}")

    print(video_id)
    # Save uploaded file
    os.makedirs(video_path.parent, exist_ok=True)
    with open(video_path, "wb") as f:
      f.write(file.file.read())

    # Extract screenshots
    os.makedirs(screenshots_dir, exist_ok=True)
    extract_screenshots(video_path, screenshots_dir)

    # Initialize models
    client = Client(
      host='http://localhost:11434'
    )

    for screenshot in screenshots_dir.iterdir():
      # Upload screenshot to Supabase
      screenshot_url = upload_to_supabase(screenshot, f"{video_id}/{screenshot.name}")

      response = requests.get(screenshot_url)

      if not response.ok :
        print("NOT OK")
        continue


      encoded_image = base64.b64encode(response.content).decode('utf-8')
      # Process with LLava and MXBai
      caption_response = client.chat(model='llava', messages=[
        {
          "role":"user",
          "content": "Describe this image",
          "images" : [encoded_image]
        }
      ])
      caption = caption_response['message']['content']
      embed_response = client.embed(model='mxbai-embed-large', input=caption)
      embeddings= embed_response['embeddings'][0]

      print(caption)
      print(embeddings)
      # Extract timestamp from filename
      frame_match = screenshot.name.split("_")[1].split(".")[0]
      timestamp = int(frame_match)

      # Save metadata to Supabase
      supabase.table("videoembed").insert({
        "video_id": video_id,
        "path": screenshot_url,
        "embedding": embeddings,
        "video_timestamp": timestamp,
        "description": caption,
      }).execute()

    # Cleanup
    os.remove(video_path)
    shutil.rmtree(screenshots_dir)

    return {"message": "Video uploaded successfully", "video_id": video_id}

  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
