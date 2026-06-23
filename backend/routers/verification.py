import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from models.schemas import VerificationCreate, VerificationAction
from db.firebase_admin_client import get_db
from services.scoring_service import compute_priority_score

router = APIRouter()


@router.post("/")
async def submit_verification(v: VerificationCreate):
    """Community verify or reject an issue."""
    db = get_db()
    issue_ref = db.collection("issues").document(v.issue_id)
    issue_doc = issue_ref.get()
    if not issue_doc.exists:
        raise HTTPException(status_code=404, detail="Issue not found")

    data = issue_doc.to_dict()
    now = datetime.now(timezone.utc)

    # Record verification
    verif_id = str(uuid.uuid4())
    db.collection("verifications").document(verif_id).set({
        "id": verif_id,
        "issue_id": v.issue_id,
        "user_id": v.user_id,
        "action": v.action.value,
        "evidence_url": v.evidence_url or "",
        "created_at": now.isoformat(),
    })

    # Update issue verification count
    delta = 1 if v.action == VerificationAction.verify else -1
    new_count = max(0, data.get("verification_count", 0) + delta)

    created_at = datetime.fromisoformat(data["created_at"])
    new_score = compute_priority_score(
        severity=data["severity"],
        verification_count=new_count,
        created_at=created_at,
        population_factor=data.get("population_factor", 0.5),
    )

    issue_ref.update({
        "verification_count": new_count,
        "priority_score": new_score,
        "updated_at": now.isoformat(),
    })

    # Update user verification count and trust score
    _update_user_stats(db, v.user_id, v.action.value)

    return {"verif_id": verif_id, "new_verification_count": new_count, "new_priority_score": new_score}


@router.get("/issue/{issue_id}")
async def get_verifications(issue_id: str):
    """Get all verifications for an issue."""
    db = get_db()
    docs = db.collection("verifications").where("issue_id", "==", issue_id).stream()
    return [doc.to_dict() for doc in docs]


def _update_user_stats(db, user_id: str, action: str):
    try:
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            d = user_doc.to_dict()
            count = d.get("verification_count", 0) + 1
            report_count = d.get("report_count", 0)
            total = report_count + count
            # Simple trust score: ratio of verifies vs total actions
            trust = d.get("trust_score", 0.5)
            user_ref.update({"verification_count": count})
            # Award badge thresholds
            if total >= 25 and trust >= 0.7:
                _award_badge(db, user_id, "Community Hero")
            elif total >= 5:
                _award_badge(db, user_id, "Civic Contributor")
        else:
            user_ref.set({"verification_count": 1, "report_count": 0, "trust_score": 0.5}, merge=True)
    except Exception:
        pass


def _award_badge(db, user_id: str, badge_type: str):
    badge_id = str(uuid.uuid4())
    # Only award if not already awarded
    existing = (
        db.collection("badges")
        .where("user_id", "==", user_id)
        .where("badge_type", "==", badge_type)
        .limit(1)
        .stream()
    )
    if not any(True for _ in existing):
        db.collection("badges").document(badge_id).set({
            "id": badge_id,
            "user_id": user_id,
            "badge_type": badge_type,
            "awarded_at": datetime.now(timezone.utc).isoformat(),
        })
