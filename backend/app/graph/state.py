from typing import Any, Dict, Optional, TypedDict


class AgentState(TypedDict):
    """
    State tracked across the LangGraph state machine.
    """
    user_action: str  # 'clean' | 'visualize' | 'predict'
    dataset_metadata: Dict[str, Any]  # Serialized DatasetMetadata or dict with schema and head
    dataset_schema_str: str  # Formatted text summary of columns, types, nulls, sample rows
    dataset_filename: str  # Original filename (e.g. 'sales.csv')
    dataset_path: str  # Path to the mounted dataset file (e.g. '/tmp/data.csv' or 'dataset.csv')
    user_instructions: Optional[str]  # Custom prompt or specific instructions from user
    target_column: Optional[str]  # Optional target column for ML / prediction
    target_format: str  # 'csv' | 'xlsx' | 'html'
    raw_llm_response: Optional[str]  # Full text returned from LLM
    generated_code: Optional[str]  # Extracted pure Python code
    expected_artifact_path: Optional[str]  # Expected output artifact (e.g. 'output_cleaned.csv', 'output_plot.html')
    error: Optional[str]  # Error message if code extraction/syntax validation fails
