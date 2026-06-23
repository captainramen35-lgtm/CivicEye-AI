from fastapi import APIRouter, HTTPException
from db.firebase_admin_client import get_db
from services.scoring_service import compute_priority_score
from datetime import datetime

router = APIRouter()


@router.post("/recalculate/{issue_id}")
async def recalculate_priority(issue_id: str):
    """Recalculate and update priority score for an issue."""
    db = get_db()
    doc_ref = db.collection("issues").document(issue_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Issue not found")

    data = doc.to_dict()
    created_at = datetime.fromisoformat(data["created_at"])
    score = compute_priority_score(
        severity=data["severity"],
        verification_count=data.get("verification_count", 0),
        created_at=created_at,
        population_factor=data.get("population_factor", 0.5),
    )

    doc_ref.update({"priority_score": score})
    return {"issue_id": issue_id, "priority_score": score}


@router.get("/queue")
async def get_priority_queue(limit: int = 50):
    """Return open issues sorted by priority score (for authority dashboard)."""
    db = get_db()
    docs = (
        db.collection("issues")
        .where("status", "in", ["reported", "ai_verified", "assigned", "in_progress"])
        .order_by("priority_score", direction="DESCENDING")
        .limit(limit)
        .stream()
    )
    return [doc.to_dict() for doc in docs]
