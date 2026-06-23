import math
from datetime import datetime, timezone
from typing import Optional


SEVERITY_WEIGHTS = {"low": 0.2, "medium": 0.6, "high": 1.0}


def compute_priority_score(
    severity: str,
    verification_count: int,
    created_at: datetime,
    population_factor: float = 0.5,
    max_verifications: int = 50,
    max_age_days: int = 90,
) -> float:
    """
    Priority score (0-100) based on:
      severity_weight        × 0.35
      verification_normalized × 0.25
      age_normalized         × 0.20
      population_factor      × 0.20
    """
    # Severity component
    sev = SEVERITY_WEIGHTS.get(severity.lower(), 0.2)

    # Verification component (normalized 0-1)
    verif = min(verification_count / max_verifications, 1.0)

    # Age component — older unresolved issues score higher
    now = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    age_days = (now - created_at).days
    age_norm = min(age_days / max_age_days, 1.0)

    # Population factor (caller provides: 0.0=remote, 1.0=near school/hospital/main road)
    pop = max(0.0, min(population_factor, 1.0))

    raw = (sev * 0.35) + (verif * 0.25) + (age_norm * 0.20) + (pop * 0.20)
    return round(raw * 100, 1)


def get_severity_color(score: float) -> str:
    if score >= 70:
        return "#D14545"   # high / critical
    elif score >= 40:
        return "#E0A23B"   # medium
    else:
        return "#3E9C6B"   # low / resolved
