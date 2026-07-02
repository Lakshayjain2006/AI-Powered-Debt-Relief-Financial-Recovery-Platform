from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environmental variables first
load_dotenv()

from app.database import engine
from app import models
from app.routers import auth, debts, profile, ai

# Initialize DB tables (SQLite auto-bootstrap)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FinRelief AI Backend",
    description="Secure backend service for debt recovery and analysis modules, authenticated via JWT and integrated with Google Gemini API.",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(debts.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "FinRelief AI Engine",
        "version": "1.0.0"
    }
