from fastapi import FastAPI
from app.routes.video_route import router
from app.config import Config

app = FastAPI()

app.include_router(router, prefix="/api", tags=["Video"])

@app.on_event("startup")
async def setup_supabase():
    if not Config.SUPABASE_URL or not Config.SUPABASE_KEY:
        raise ValueError("Supabase configuration is missing!")
    print("All set!")

@app.get("/")
async def root():
    return {"message": "FastAPI App is running!"}
