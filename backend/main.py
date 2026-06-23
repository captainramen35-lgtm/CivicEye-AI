import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import issues, ai_analysis, duplicates, priority, verification, analytics, gamification

app = FastAPI(
    title="CivicEye AI API",
    description="AI-powered hyperlocal civic issue reporting platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://*.firebaseapp.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(issues.router, prefix="/issues", tags=["issues"])
app.include_router(ai_analysis.router, prefix="/ai", tags=["ai"])
app.include_router(duplicates.router, prefix="/duplicates", tags=["duplicates"])
app.include_router(priority.router, prefix="/priority", tags=["priority"])
app.include_router(verification.router, prefix="/verification", tags=["verification"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(gamification.router, prefix="/gamification", tags=["gamification"])


@app.get("/")
async def root():
    return {"message": "CivicEye AI API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
