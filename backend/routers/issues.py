import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from models.schemas import IssueCreate, IssueOut, IssueStatus, StatusUpdate
from db.firebase_admin_client import get_db
from services.scoring_service import compute_priority_score
from services.geo_service import build_geo_query_bounds, haversine_distance

router = APIRouter()


@router.post("/", response_model=dict)
async def create_issue(issue: IssueCreate):
    """Create a new civic issue report."""
    db = get_db()
    issue_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    priority = compute_priority_score(
        severity=issue.severity.value,
        verification_count=0,
        created_at=now,
        population_factor=0.5,
    )

    doc = {
        "id": issue_id,
        "photo_url": issue.photo_url or "",
        "issue_type": issue.issue_type,
        "severity": issue.severity.value,
        "risk_notes": issue.risk_notes,
        "department": issue.department,
        "category": issue.category.value,
        "status": IssueStatus.reported.value,
        "lat": issue.lat,
        "lng": issue.lng,
        "address": issue.address or "",
        "priority_score": priority,
        "verification_count": 0,
        "reporter_id": issue.reporter_id,
        "description": issue.description or "",
        "status_history": [
            {
                "status": IssueStatus.reported.value,
                "timestamp": now.isoformat(),
                "actor": issue.reporter_id,
                "note": "Issue reported by citizen",
            }
        ],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    db.collection("issues").document(issue_id).set(doc)

    # Award badge if first report
    _check_reporter_badge(db, issue.reporter_id)

    return {"id": issue_id, "priority_score": priority, "status": IssueStatus.reported.value}


@router.get("/", response_model=List[dict])
async def list_issues(
    category: Optional[str] = None,
    status: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_m: float = 5000,
    limit: int = 50,
):
    """List issues with optional filters."""
    db = get_db()
    query = db.collection("issues")

    if category:
        query = query.where("category", "==", category)
    if status:
        query = query.where("status", "==", status)

    docs = query.limit(limit).stream()
    issues = []
    for doc in docs:
        data = doc.to_dict()
        if lat and lng:
            dist = haversine_distance(lat, lng, data.get("lat", 0), data.get("lng", 0))
            if dist > radius_m:
                continue
            data["distance_m"] = round(dist)
        issues.append(data)

    # Sort by priority score descending
    issues.sort(key=lambda x: x.get("priority_score", 0), reverse=True)
    return issues


@router.get("/{issue_id}", response_model=dict)
async def get_issue(issue_id: str):
    """Get a single issue by ID."""
    db = get_db()
    doc = db.collection("issues").document(issue_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Issue not found")
    return doc.to_dict()


@router.patch("/{issue_id}/status", response_model=dict)
async def update_status(issue_id: str, update: StatusUpdate):
    """Advance an issue through the status lifecycle (authority only)."""
    db = get_db()
    doc_ref = db.collection("issues").document(issue_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Issue not found")

    now = datetime.now(timezone.utc)
    data = doc.to_dict()
    history = data.get("status_history", [])
    history.append({
        "status": update.new_status.value,
        "timestamp": now.isoformat(),
        "actor": update.authority_id,
        "note": update.note or "",
    })

    doc_ref.update({
        "status": update.new_status.value,
        "status_history": history,
        "updated_at": now.isoformat(),
    })

    return {"id": issue_id, "status": update.new_status.value}


def _check_reporter_badge(db, user_id: str):
    """Award Community Reporter badge on first report."""
    try:
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            count = user_doc.to_dict().get("report_count", 0) + 1
            user_ref.update({"report_count": count})
            if count == 1:
                _award_badge(db, user_id, "Community Reporter")
            elif count >= 5:
                _award_badge(db, user_id, "Civic Contributor")
        else:
            user_ref.set({"report_count": 1, "verification_count": 0, "trust_score": 0.5}, merge=True)
            _award_badge(db, user_id, "Community Reporter")
    except Exception:
        pass


def _award_badge(db, user_id: str, badge_type: str):
    """Add a badge document for the user."""
    from datetime import datetime, timezone
    badge_id = str(uuid.uuid4())
    db.collection("badges").document(badge_id).set({
        "id": badge_id,
        "user_id": user_id,
        "badge_type": badge_type,
        "awarded_at": datetime.now(timezone.utc).isoformat(),
    })
