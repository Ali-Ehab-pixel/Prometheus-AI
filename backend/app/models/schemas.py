from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ActionType(str, Enum):
    CLEAN = "clean"
    VISUALIZE = "visualize"
    PREDICT = "predict"


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
    execution_time_seconds: float = 0.0
    error: Optional[str] = None
