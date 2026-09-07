import os
import tempfile
import pandas as pd
import numpy as np
import pytest

from app.data.profiler import profile_dataset
from app.data.health_score import calculate_health_score
from app.data.recommendations import generate_recommendations
from app.data.versioning import DatasetVersionManager


@pytest.fixture
def sample_df():
    data = {
        "id": [1, 2, 3, 4, 5],
        "name": ["Alice", "Bob", "Charlie", "David", "Eve"],
        "age": [25, 30, 35, 40, 100],
        "salary": [50000.0, 60000.0, 75000.0, 90000.0, None],
        "churn": [0, 1, 0, 1, 0],
        "constant_col": ["fixed", "fixed", "fixed", "fixed", "fixed"],
    }
    return pd.DataFrame(data)


def test_dataset_profiler(sample_df):
    profile = profile_dataset(sample_df, "test_sample.csv")
    assert profile["row_count"] == 5
    assert profile["col_count"] == 6
    assert profile["file_type"] == "csv"
    assert len(profile["columns"]) == 6
    assert "churn" in profile["target_suggestions"]
    issues = [iss["issue"] for iss in profile["quality_issues"]]
    assert "constant_column" in issues
    assert "potential_id" in issues
    assert "age" in profile["correlation_matrix"]


def test_health_score_calculation(sample_df):
    profile = profile_dataset(sample_df, "test_sample.csv")
    health = calculate_health_score(profile)
    assert "overall_score" in health
    assert 0 <= health["overall_score"] <= 100
    assert "grade" in health
    assert health["grade"] in ["A", "B", "C", "D", "F"]
    assert "completeness" in health
    assert len(health["issues"]) > 0


def test_recommendations_engine(sample_df):
    profile = profile_dataset(sample_df, "test_sample.csv")
    health = calculate_health_score(profile)
    recs = generate_recommendations(profile, health)
    assert len(recs) > 0
    actions = [r["action"] for r in recs]
    assert "classify" in actions
    assert "analyze_all" in actions


def test_version_manager():
    with tempfile.TemporaryDirectory() as temp_dir:
        test_db = os.path.join(temp_dir, "test.db")
        vm = DatasetVersionManager(base_dir=temp_dir, db_path=test_db)
        df1 = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
        df2 = pd.DataFrame({"a": [1, 2], "b": [4, 5]})
        v1 = vm.save_version("test_file_123", df1, "Original")
        assert v1["row_count"] == 3
        v2 = vm.save_version("test_file_123", df2, "Cleaned")
        assert v2["row_count"] == 2
        versions = vm.list_versions("test_file_123")
        assert len(versions) == 2
        restored_df = vm.get_version("test_file_123", v1["version_id"])
        assert len(restored_df) == 3
