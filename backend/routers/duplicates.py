import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db.firebase_admin_client import get_db
from services.geo_service import build_geo_query_bounds, haversine_distance
from services.gemini_service import get_description_embedding

router = APIRouter()

DUPLICATE_DISTANCE_M = 150
SIMILARITY_THRESHOLD = 0.82


class DuplicateCheckRequest(BaseModel):
    issue_type: str
    category: str
    description: Optional[str] = ""
    lat: float
    lng: float


def cosine_similarity(a: list, b: list) -> float:
    va, vb = np.array(a), np.array(b)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    if denom == 0:
        return 0.0
    return float(np.dot(va, vb) / denom)


@router.post("/check")
async def check_duplicate(request: DuplicateCheckRequest):
    """
    Check if a new report is a duplicate of an existing open issue.
    Returns merge target issue_id if duplicate found, else None.
    """
    db = get_db()
    bounds = build_geo_query_bounds(request.lat, request.lng, DUPLICATE_DISTANCE_M)

    # Query by category within lat bounding box
    candidates = (
        db.collection("issues")
        .where("category", "==", request.category)
        .where("status", "in", ["reported", "ai_verified", "assigned", "in_progress"])
        .where("lat", ">=", bounds["min_lat"])
        .where("lat", "<=", bounds["max_lat"])
        .stream()
    )

    new_embedding = None
    try:
        new_embedding = await get_description_embedding(
            f"{request.issue_type}: {request.description}"
        )
    except Exception:
        pass

    best_match = None
    best_score = 0.0

    for doc in candidates:
        data = doc.to_dict()
        # Exact distance check
        dist = haversine_distance(request.lat, request.lng, data.get("lat", 0), data.get("lng", 0))
        if dist > DUPLICATE_DISTANCE_M:
            continue

        # Text similarity via embedding
        if new_embedding and data.get("embedding"):
            sim = cosine_similarity(new_embedding, data["embedding"])
            if sim > best_score:
                best_score = sim
                best_match = data

    if best_match and best_score >= SIMILARITY_THRESHOLD:
        return {
            "is_duplicate": True,
            "existing_issue_id": best_match["id"],
            "similarity_score": round(best_score, 3),
        }

    return {"is_duplicate": False, "existing_issue_id": None, "similarity_score": 0.0}


@router.post("/merge/{existing_id}")
async def merge_into_existing(existing_id: str):
    """Bump verification count on existing issue (duplicate merge)."""
    db = get_db()
    doc_ref = db.collection("issues").document(existing_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Issue not found")

    data = doc.to_dict()
    new_count = data.get("verification_count", 0) + 1

    from services.scoring_service import compute_priority_score
    from datetime import datetime
    created_at = datetime.fromisoformat(data["created_at"])
    new_score = compute_priority_score(
        severity=data["severity"],
        verification_count=new_count,
        created_at=created_at,
    )

    doc_ref.update({"verification_count": new_count, "priority_score": new_score})
    return {"merged_into": existing_id, "new_verification_count": new_count, "new_priority_score": new_score}
