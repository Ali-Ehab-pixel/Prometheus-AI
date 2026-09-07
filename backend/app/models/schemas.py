from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ActionType(str, Enum):
    CLEAN = "clean"
    VISUALIZE = "visualize"
    PREDICT = "predict"
    INSIGHTS = "insights"
    CLASSIFY = "classify"
    AUTOML = "automl"
    ANALYZE_ALL = "analyze_all"


class OutputFormat(str, Enum):
    CSV = "csv"
    XLSX = "xlsx"
    HTML = "html"
    JSON = "json"


class ColumnInfo(BaseModel):
    name: str
    dtype: str
    null_count: int
    unique_count: int
    sample_values: List[Any] = Field(default_factory=list)


class DatasetMetadata(BaseModel):
    filename: str
    file_type: str
    row_count: int
    col_count: int
    columns: List[ColumnInfo]
    head_rows: List[Dict[str, Any]]
    summary_stats: Optional[Dict[str, Any]] = None
    memory_usage_mb: float = 0.0


class UploadResponse(BaseModel):
    success: bool
    file_id: str
    original_filename: str
    file_path: str
    metadata: DatasetMetadata
    message: str = "File parsed successfully"
    profile: Optional[Dict[str, Any]] = None
    health_score: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None


class ActionRequest(BaseModel):
    file_id: str
    action: ActionType
    custom_prompt: Optional[str] = None
    target_column: Optional[str] = None
    output_format: Optional[OutputFormat] = None


class ArtifactInfo(BaseModel):
    filename: str
    file_type: str
    mime_type: str
    size_bytes: int
    download_url: Optional[str] = None
    html_content: Optional[str] = None


class ActionResponse(BaseModel):
    success: bool
    action: ActionType
    generated_code: str
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    artifact: Optional[ArtifactInfo] = None
    artifacts: List[ArtifactInfo] = Field(default_factory=list)
    execution_time_seconds: float = 0.0
    insights_data: Optional[Dict[str, Any]] = None
    leaderboard_data: Optional[Dict[str, Any]] = None
    explainability_data: Optional[Dict[str, Any]] = None
    version_saved: Optional[str] = None
    error: Optional[str] = None


class ChatMessage(BaseModel):
    role: str  # "user", "assistant", or "system"
    content: str


class CopilotChatRequest(BaseModel):
    file_id: str
    message: str
    history: List[ChatMessage] = Field(default_factory=list)


class CopilotChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = Field(default_factory=list)
    suggested_follow_ups: List[str] = Field(default_factory=list)


# === Phase 6: Explainability Schemas ===

class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float
    raw_score: float
    direction: Optional[str] = "neutral"  # "positive", "negative", or "neutral"


class ExplainabilityData(BaseModel):
    target_column: str
    method: str
    summary: str
    top_features: List[FeatureImportanceItem] = Field(default_factory=list)


# === Phase 7 & 8: Reports, What-If, and History Schemas ===

class ReportGenerateRequest(BaseModel):
    file_id: str
    format: str = "html"  # "html" or "xlsx"
    title: Optional[str] = "Executive Data Science Report"


class ReportGenerateResponse(BaseModel):
    success: bool
    format: str
    filename: str
    download_url: str
    message: str


class PredictWhatIfRequest(BaseModel):
    file_id: str
    features: Dict[str, Any]


class PredictWhatIfResponse(BaseModel):
    success: bool
    prediction: Any
    confidence: Optional[float] = None
    probabilities: Optional[Dict[str, float]] = None
    task_type: Optional[str] = None
    error: Optional[str] = None


class AnalysisHistoryItem(BaseModel):
    id: str
    file_id: str
    action: str
    custom_prompt: Optional[str] = None
    target_column: Optional[str] = None
    success: bool
    execution_time_seconds: float
    artifact_filename: Optional[str] = None
    created_at: str


class AnalysisHistoryResponse(BaseModel):
    history: List[AnalysisHistoryItem] = Field(default_factory=list)


