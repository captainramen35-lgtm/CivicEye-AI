from fastapi import APIRouter, HTTPException
from db.firebase_admin_client import get_db

router = APIRouter()

BADGE_THRESHOLDS = {
    "Community Reporter": {"reports": 1, "trust_min": 0.0},
    "Civic Contributor": {"reports": 5, "trust_min": 0.0},
    "Community Hero": {"reports": 25, "trust_min": 0.7},
    "City Guardian": {"reports": 100, "trust_min": 0.85},
}


@router.get("/leaderboard")
async def get_leaderboard(limit: int = 50):
    """Get top civic contributors."""
    db = get_db()
    users = []
    for doc in db.collection("users").stream():
        d = doc.to_dict()
        d["uid"] = doc.id
        total = d.get("report_count", 0) + d.get("verification_count", 0)
        d["total_contributions"] = total
        # Get badges
        badges = [
            b.to_dict()
            for b in db.collection("badges").where("user_id", "==", doc.id).stream()
        ]
        d["badges"] = badges
        d["badge_level"] = _get_badge_level(d)
        users.append(d)

    users.sort(key=lambda u: u.get("total_contributions", 0), reverse=True)
    return users[:limit]


@router.get("/user/{user_id}/badges")
async def get_user_badges(user_id: str):
    """Get all badges for a user."""
    db = get_db()
    docs = db.collection("badges").where("user_id", "==", user_id).stream()
    badges = [doc.to_dict() for doc in docs]
    return {"user_id": user_id, "badges": badges}


@router.get("/user/{user_id}/profile")
async def get_user_profile(user_id: str):
    """Get user's full gamification profile."""
    db = get_db()
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_doc.to_dict()
    badges = [
        b.to_dict()
        for b in db.collection("badges").where("user_id", "==", user_id).stream()
    ]
    reports = [
        r.to_dict()
        for r in db.collection("issues").where("reporter_id", "==", user_id).stream()
    ]

    user_data["badges"] = badges
    user_data["reports"] = reports
    user_data["badge_level"] = _get_badge_level(user_data)
    user_data["total_contributions"] = (
        user_data.get("report_count", 0) + user_data.get("verification_count", 0)
    )
    return user_data


def _get_badge_level(user_data: dict) -> str:
    report_count = user_data.get("report_count", 0)
    trust_score = user_data.get("trust_score", 0.0)
    total = report_count + user_data.get("verification_count", 0)

    if total >= 100 and trust_score >= 0.85:
        return "City Guardian"
    elif total >= 25 and trust_score >= 0.7:
        return "Community Hero"
    elif total >= 5:
        return "Civic Contributor"
    elif total >= 1:
        return "Community Reporter"
    return "Newcomer"
