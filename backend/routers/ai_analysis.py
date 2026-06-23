import base64
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional
from services.gemini_service import analyze_image
from models.schemas import AIAnalysisResult

router = APIRouter()


class AnalyzeRequest(BaseModel):
    image_base64: str


@router.post("/analyze", response_model=AIAnalysisResult)
async def analyze_issue_image(request: AnalyzeRequest):
    """Analyze a civic issue image using Gemini Vision."""
    try:
        result = await analyze_image(request.image_base64)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


@router.post("/analyze-upload", response_model=AIAnalysisResult)
async def analyze_issue_upload(file: UploadFile = File(...)):
    """Analyze a civic issue image uploaded as multipart form."""
    try:
        contents = await file.read()
        b64 = base64.b64encode(contents).decode()
        result = await analyze_image(b64)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")
