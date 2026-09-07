from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

class ColumnProfile(BaseModel):
    name: str
    dtype: str
    null_count: int
    null_percentage: float
    unique_count: int
    cardinality_ratio: float
    sample_values: List[Any] = Field(default_factory=list)
    stats: Optional[Dict[str, Any]] = None  # min, max, mean, median, std for numerics
    top_values: Optional[List[Dict[str, Any]]] = None  # top-5 for categoricals
    quality_issues: List[str] = Field(default_factory=list)

class DataQualityIssue(BaseModel):
    issue_type: str
    column: Optional[str] = None
    severity: str  # 'low', 'medium', 'high', 'critical'
    description: str
    suggested_fix: Optional[str] = None

class HealthScoreBreakdown(BaseModel):
    overall_score: float
    completeness: float
    consistency: float  
    uniqueness: float
    validity: float
    shape: float
    grade: str  # A, B, C, D, F
    issues: List[DataQualityIssue] = Field(default_factory=list)

class Recommendation(BaseModel):
    action: str
    title: str
    reason: str
    priority: int = Field(ge=1, le=5)
    confidence: float = Field(ge=0, le=1)

class DatasetVersion(BaseModel):
    version_id: str
    label: str
    timestamp: str
    row_count: int
    col_count: int

class DatasetProfileResponse(BaseModel):
    profile: Dict[str, Any]
    health_score: HealthScoreBreakdown
    recommendations: List[Recommendation]
    target_suggestions: List[str] = Field(default_factory=list)
