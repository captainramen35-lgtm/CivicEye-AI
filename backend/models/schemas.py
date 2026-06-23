from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class IssueSeverity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class IssueStatus(str, Enum):
    reported = "reported"
    ai_verified = "ai_verified"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"


class IssueCategory(str, Enum):
    road_damage = "Road Damage"
    water_leakage = "Water Leakage"
    waste_management = "Waste Management"
    streetlight_failure = "Streetlight Failure"
    drainage_issues = "Drainage Issues"
    public_safety = "Public Safety Concerns"
    infrastructure_damage = "Infrastructure Damage"


class AIAnalysisResult(BaseModel):
    issue_type: str
    severity: IssueSeverity
    risk_notes: str
    department: str
    category: IssueCategory
    confidence: float = Field(ge=0.0, le=1.0, default=0.85)


class IssueCreate(BaseModel):
    photo_base64: Optional[str] = None
    photo_url: Optional[str] = None
    issue_type: str
    severity: IssueSeverity
    risk_notes: str
    department: str
    category: IssueCategory
    lat: float
    lng: float
    address: Optional[str] = None
    reporter_id: str
    description: Optional[str] = None


class IssueOut(BaseModel):
    id: str
    photo_url: Optional[str] = None
    issue_type: str
    severity: IssueSeverity
    risk_notes: str
    department: str
    category: IssueCategory
    status: IssueStatus
    lat: float
    lng: float
    address: Optional[str] = None
    priority_score: float
    verification_count: int
    reporter_id: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class VerificationAction(str, Enum):
    verify = "verify"
    reject = "reject"


class VerificationCreate(BaseModel):
    issue_id: str
    user_id: str
    action: VerificationAction
    evidence_url: Optional[str] = None


class StatusUpdate(BaseModel):
    issue_id: str
    new_status: IssueStatus
    authority_id: str
    note: Optional[str] = None


class BadgeLevel(str, Enum):
    community_reporter = "Community Reporter"
    civic_contributor = "Civic Contributor"
    community_hero = "Community Hero"
    city_guardian = "City Guardian"
