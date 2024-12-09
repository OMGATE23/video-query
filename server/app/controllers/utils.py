import subprocess
from pathlib import Path
from app.config import Config
from supabase import create_client, Client

SUPABASE_URL: str = Config.SUPABASE_URL
SUPABBASE_KEY: str = Config.SUPABASE_KEY

def extract_screenshots(video_path: Path, output_dir: Path):
  try:
    subprocess.run(
      [
        "ffmpeg",
        "-i", str(video_path),
        "-vf", "fps=1",
        str(output_dir / "frame_%04d.png")
      ],
      check=True
    )
  except subprocess.CalledProcessError as e:
    raise RuntimeError(f"Error extracting screenshots: {e}")

def upload_to_supabase(file_path: Path, destination_path: str):
  supabase: Client = create_client(SUPABASE_URL, SUPABBASE_KEY)
  with open(file_path, "rb") as f:
    response = supabase.storage.from_("screenshots").upload(destination_path, f)
    if not response or hasattr(response, "error"):  # Adjust this line based on `response` structure
      error_message = getattr(response, "error", "Unknown error")
      raise RuntimeError(f"Supabase upload failed: {error_message}")
    signed_url = supabase.storage.from_("screenshots").create_signed_url(destination_path, 60 * 60 * 12)
    print(signed_url)
    return signed_url["signedURL"]
