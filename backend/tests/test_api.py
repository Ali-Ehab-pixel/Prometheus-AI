import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "primary_model" in data


def test_upload_csv_endpoint():
    csv_content = "name,age,city\nAlice,30,New York\nBob,25,San Francisco\n"
    file_bytes = io.BytesIO(csv_content.encode("utf-8"))
    
    response = client.post(
        "/api/upload",
        files={"file": ("users.csv", file_bytes, "text/csv")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["metadata"]["row_count"] == 2
    assert data["metadata"]["col_count"] == 3
    assert len(data["metadata"]["columns"]) == 3
    assert data["file_id"] is not None


def test_invalid_extension_upload():
    response = client.post(
        "/api/upload",
        files={"file": ("malicious.exe", io.BytesIO(b"binary"), "application/octet-stream")},
    )
    assert response.status_code == 400


def test_copilot_chat_nonexistent_file():
    response = client.post(
        "/api/copilot/chat",
        json={"file_id": "nonexistent-id", "message": "What is this data?", "history": []},
    )
    assert response.status_code == 404


def test_report_generation_endpoints():
    csv_content = "age,salary,purchased\n25,50000,1\n30,65000,0\n35,80000,1\n"
    res = client.post(
        "/api/upload",
        files={"file": ("report_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    assert res.status_code == 200
    file_id = res.json()["file_id"]

    # Test HTML report generation
    html_res = client.post(
        f"/api/datasets/{file_id}/report",
        json={"file_id": file_id, "format": "html"},
    )
    assert html_res.status_code == 200
    html_data = html_res.json()
    assert html_data["success"] is True
    assert html_data["format"] == "html"
    assert "download_url" in html_data

    # Download the generated HTML artifact
    dl_res = client.get(html_data["download_url"])
    assert dl_res.status_code == 200
    assert "Executive Data Science Report" in dl_res.text

    # Test Excel report generation
    xlsx_res = client.post(
        f"/api/datasets/{file_id}/report",
        json={"file_id": file_id, "format": "xlsx"},
    )
    assert xlsx_res.status_code == 200
    xlsx_data = xlsx_res.json()
    assert xlsx_data["success"] is True
    assert xlsx_data["format"] == "xlsx"


def test_what_if_predict_endpoint():
    csv_content = "x1,x2,target\n1,2,10\n2,3,20\n3,4,30\n"
    res = client.post(
        "/api/upload",
        files={"file": ("predict_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    assert res.status_code == 200
    file_id = res.json()["file_id"]

    # No model yet -> 400
    pred_res_empty = client.post(
        f"/api/models/{file_id}/predict",
        json={"file_id": file_id, "features": {"x1": 5, "x2": 6}},
    )
    assert pred_res_empty.status_code == 400

    # Train and save a dummy model into session
    import joblib
    import os
    from sklearn.linear_model import LinearRegression
    import pandas as pd
    from app.main import FILE_REGISTRY, settings

    dummy_model = LinearRegression()
    dummy_model.fit(pd.DataFrame([[1, 2], [2, 3], [3, 4]], columns=["x1", "x2"]), [10, 20, 30])
    model_path = os.path.join(settings.ARTIFACT_DIR, f"{file_id}_best_model.joblib")
    joblib.dump(dummy_model, model_path)
    FILE_REGISTRY[file_id]["model_artifact_path"] = model_path

    pred_res = client.post(
        f"/api/models/{file_id}/predict",
        json={"file_id": file_id, "features": {"x1": 4, "x2": 5}},
    )
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    assert pred_data["success"] is True
    assert round(pred_data["prediction"]) == 40


def test_analyses_history_endpoint():
    res = client.get("/api/analyses/history")
    assert res.status_code == 200
    data = res.json()
    assert "history" in data
    assert isinstance(data["history"], list)


