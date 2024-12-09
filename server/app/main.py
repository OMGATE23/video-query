from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.video_route import router
from app.config import Config


app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api", tags=["Video"])

@app.on_event("startup")
async def setup_supabase():
    if not Config.SUPABASE_URL or not Config.SUPABASE_KEY:
        raise ValueError("Supabase configuration is missing!")
    print("All set!")

@app.get("/")
async def root():
    return {"message": "FastAPI App is running!"}
