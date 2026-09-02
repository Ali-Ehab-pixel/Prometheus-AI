import os
import tempfile
import pandas as pd
from app.sandbox.runner import run_code_locally_isolated


def test_sandbox_local_execution_cleaning():
    # 1. Create a dummy dataset
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        f.write("a,b,c\n1,2,3\n4,,6\n7,8,9\n")
        temp_dataset = f.name

    sample_code = """import pandas as pd

df = pd.read_csv('test_data.csv')
df.fillna(0, inplace=True)
df.to_csv('output_cleaned.csv', index=False)
print(f"Processed {len(df)} rows.")
"""

    try:
        result = run_code_locally_isolated(
            code=sample_code,
            dataset_path=temp_dataset,
            dataset_filename="test_data.csv",
            expected_artifact_name="output_cleaned.csv",
        )

        assert result.success is True
        assert "Processed 3 rows" in result.stdout
        assert result.artifact_bytes is not None
        assert result.artifact_filename == "output_cleaned.csv"
        assert b"4,0.0,6" in result.artifact_bytes or b"1,2.0,3" in result.artifact_bytes
    finally:
        os.remove(temp_dataset)


def test_sandbox_local_execution_plot():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        f.write("x,y\n1,10\n2,20\n3,30\n")
        temp_dataset = f.name

    sample_plot_code = """import pandas as pd
import plotly.express as px

df = pd.read_csv('test_plot.csv')
fig = px.line(df, x='x', y='y', title='Test Chart')
fig.write_html('output_plot.html')
print("Generated Plotly chart.")
"""

    try:
        result = run_code_locally_isolated(
            code=sample_plot_code,
            dataset_path=temp_dataset,
            dataset_filename="test_plot.csv",
            expected_artifact_name="output_plot.html",
        )

        assert result.success is True
        assert "Generated Plotly chart" in result.stdout
        assert result.artifact_bytes is not None
        assert result.artifact_filename == "output_plot.html"
        assert b"plotly" in result.artifact_bytes.lower()
    finally:
        os.remove(temp_dataset)
