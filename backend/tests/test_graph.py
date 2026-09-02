import pytest
from app.graph.nodes import extract_python_code, validate_python_syntax
from app.graph.router import route_action
from app.graph.state import AgentState
from app.graph.workflow import build_analysis_graph


def test_route_action():
    state_clean: AgentState = {"user_action": "clean", "dataset_metadata": {}, "dataset_schema_str": "", "dataset_filename": "data.csv", "dataset_path": "data.csv", "user_instructions": None, "target_column": None, "target_format": "csv", "raw_llm_response": None, "generated_code": None, "expected_artifact_path": None, "error": None}
    assert route_action(state_clean) == "data_engineer"

    state_vis: AgentState = {"user_action": "visualize", "dataset_metadata": {}, "dataset_schema_str": "", "dataset_filename": "data.csv", "dataset_path": "data.csv", "user_instructions": None, "target_column": None, "target_format": "html", "raw_llm_response": None, "generated_code": None, "expected_artifact_path": None, "error": None}
    assert route_action(state_vis) == "visualization"

    state_predict: AgentState = {"user_action": "predict", "dataset_metadata": {}, "dataset_schema_str": "", "dataset_filename": "data.csv", "dataset_path": "data.csv", "user_instructions": None, "target_column": "target", "target_format": "csv", "raw_llm_response": None, "generated_code": None, "expected_artifact_path": None, "error": None}
    assert route_action(state_predict) == "ml_forecaster"


def test_extract_python_code():
    raw_markdown = """Here is the Python script:
```python
import pandas as pd

df = pd.read_csv('dataset.csv')
df.dropna(inplace=True)
df.to_csv('output_cleaned.csv', index=False)
print("Data cleaned successfully.")
```
Let me know if you need changes!"""

    code = extract_python_code(raw_markdown)
    assert "import pandas as pd" in code
    assert "df.dropna(inplace=True)" in code
    assert "Let me know" not in code
    assert validate_python_syntax(code) is None


def test_graph_compilation():
    graph = build_analysis_graph()
    assert graph is not None
