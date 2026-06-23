from collections import defaultdict
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from db.firebase_admin_client import get_db

router = APIRouter()


@router.get("/impact")
async def get_impact_stats():
    """Global impact dashboard stats."""
    db = get_db()
    all_issues = [doc.to_dict() for doc in db.collection("issues").stream()]

    total = len(all_issues)
    resolved = sum(1 for i in all_issues if i.get("status") == "resolved")
    resolution_rate = round((resolved / total * 100) if total > 0 else 0, 1)

    # Avg resolution time for resolved issues
    resolution_times = []
    for issue in all_issues:
        if issue.get("status") == "resolved" and issue.get("status_history"):
            history = issue["status_history"]
            created = datetime.fromisoformat(issue["created_at"])
            resolved_entry = next((h for h in reversed(history) if h["status"] == "resolved"), None)
            if resolved_entry:
                resolved_dt = datetime.fromisoformat(resolved_entry["timestamp"])
                delta = (resolved_dt - created).total_seconds() / 3600  # hours
                resolution_times.append(delta)

    avg_resolution_hours = round(sum(resolution_times) / len(resolution_times), 1) if resolution_times else 0

    # By category
    by_category = defaultdict(int)
    for issue in all_issues:
        by_category[issue.get("category", "Unknown")] += 1

    # By status
    by_status = defaultdict(int)
    for issue in all_issues:
        by_status[issue.get("status", "unknown")] += 1

    return {
        "total_reported": total,
        "total_resolved": resolved,
        "resolution_rate": resolution_rate,
        "avg_resolution_hours": avg_resolution_hours,
        "by_category": dict(by_category),
        "by_status": dict(by_status),
        "total_users": len([doc.id for doc in db.collection("users").list_documents()]),
    }


@router.get("/trends")
async def get_trends(days: int = 30):
    """Get rising issue trends over recent period."""
    db = get_db()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    docs = db.collection("issues").where("created_at", ">=", cutoff).stream()
    issues = [doc.to_dict() for doc in docs]

    # Category trend over time (weekly buckets)
    weekly: dict = defaultdict(lambda: defaultdict(int))
    for issue in issues:
        cat = issue.get("category", "Unknown")
        created = issue.get("created_at", "")[:10]  # YYYY-MM-DD
        weekly[cat][created] += 1

    # Severity trend
    severity_trend = defaultdict(int)
    for issue in issues:
        severity_trend[issue.get("severity", "low")] += 1

    # Hot zones (areas with most issues)
    area_counts: dict = defaultdict(int)
    for issue in issues:
        area = issue.get("address", "Unknown area")
        area_counts[area] += 1

    top_areas = sorted(area_counts.items(), key=lambda x: x[1], reverse=True)[:10]

    return {
        "period_days": days,
        "total_in_period": len(issues),
        "by_category_weekly": {cat: dict(dates) for cat, dates in weekly.items()},
        "by_severity": dict(severity_trend),
        "top_areas": [{"area": a, "count": c} for a, c in top_areas],
    }


@router.get("/heatmap-data")
async def get_heatmap_data():
    """Return lat/lng/weight points for the map heatmap."""
    db = get_db()
    docs = db.collection("issues").stream()
    points = []
    for doc in docs:
        d = doc.to_dict()
        weight = 1.0
        if d.get("severity") == "high":
            weight = 3.0
        elif d.get("severity") == "medium":
            weight = 2.0
        points.append({
            "lat": d.get("lat"),
            "lng": d.get("lng"),
            "weight": weight,
            "category": d.get("category"),
        })
    return {"points": points}
