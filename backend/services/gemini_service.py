import os
import base64
import json
import google.generativeai as genai
from PIL import Image
import io
from models.schemas import AIAnalysisResult, IssueSeverity, IssueCategory

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

CATEGORY_MAP = {
    "pothole": IssueCategory.road_damage,
    "road crack": IssueCategory.road_damage,
    "road damage": IssueCategory.road_damage,
    "water leak": IssueCategory.water_leakage,
    "pipe burst": IssueCategory.water_leakage,
    "water leakage": IssueCategory.water_leakage,
    "garbage": IssueCategory.waste_management,
    "waste": IssueCategory.waste_management,
    "trash": IssueCategory.waste_management,
    "streetlight": IssueCategory.streetlight_failure,
    "light out": IssueCategory.streetlight_failure,
    "drainage": IssueCategory.drainage_issues,
    "flooding": IssueCategory.drainage_issues,
    "public safety": IssueCategory.public_safety,
    "hazard": IssueCategory.public_safety,
    "infrastructure": IssueCategory.infrastructure_damage,
    "bridge": IssueCategory.infrastructure_damage,
}

CLASSIFICATION_PROMPT = """You are a civic infrastructure expert analyzing a photo for a citizen issue reporting app.

Analyze the image and return a JSON object with EXACTLY these fields:
{
  "issue_type": "short name of the issue (e.g. Pothole, Water Leak, Broken Streetlight, Overflowing Garbage, Drainage Blockage, Road Crack, Damaged Footpath)",
  "severity": "low" | "medium" | "high",
  "risk_notes": "1-2 sentence risk description, mention nearby hazards or affected populations",
  "department": "responsible municipal department (e.g. Roads Department, Water Board, Sanitation Department, Electricity Board, Public Works Department)",
  "category": one of exactly: "Road Damage" | "Water Leakage" | "Waste Management" | "Streetlight Failure" | "Drainage Issues" | "Public Safety Concerns" | "Infrastructure Damage",
  "confidence": number between 0.0 and 1.0
}

Severity guide:
- low: minor inconvenience, no immediate hazard
- medium: moderate impact, could worsen or cause injury
- high: immediate hazard, blocking traffic, flooding, structural risk

Return ONLY the JSON object, no explanation."""


async def analyze_image(image_base64: str) -> AIAnalysisResult:
    """Send image to Gemini Vision and get structured civic issue classification."""
    model = genai.GenerativeModel("gemini-2.5-flash")

    # Decode base64 image
    image_data = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_data))

    # Convert to JPEG if needed
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    response = model.generate_content(
        [CLASSIFICATION_PROMPT, image],
        generation_config=genai.types.GenerationConfig(
            temperature=0.1,
            max_output_tokens=512,
            response_mime_type="application/json",
        ),
    )

    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    print("--- RAW GEMINI RESPONSE ---")
    print(repr(text))
    print("----------------------------")
    data = json.loads(text)

    return AIAnalysisResult(
        issue_type=data["issue_type"],
        severity=IssueSeverity(data["severity"]),
        risk_notes=data["risk_notes"],
        department=data["department"],
        category=IssueCategory(data["category"]),
        confidence=float(data.get("confidence", 0.85)),
    )


async def get_description_embedding(text: str) -> list[float]:
    """Get text embedding for duplicate detection."""
    model = genai.GenerativeModel("gemini-2.5-flash")
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="SEMANTIC_SIMILARITY",
    )
    return result["embedding"]
