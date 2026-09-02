import os
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_e2e_clean_action():
    csv_data = "id,product,price,quantity,discount\n1,Keyboard,50.0,2,0.1\n2,Mouse,,5,0.0\n3,Monitor,200.0,,0.15\n"
    response = client.post(
        "/api/upload",
        files={"file": ("sales_sample.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")},
    )
    assert response.status_code == 200
    upload_res = response.json()
    file_id = upload_res["file_id"]

    action_payload = {
        "file_id": file_id,
        "action": "clean",
        "custom_prompt": "Fill missing values and normalize column names.",
        "output_format": "csv",
    }
    action_res = client.post("/api/action", json=action_payload)
    assert action_res.status_code == 200
    data = action_res.json()
    
    assert data["success"] is True
    assert data["generated_code"] is not None
    assert len(data["generated_code"]) > 0
    assert data["action"] == "clean"
    assert data["artifact"] is not None
    assert data["artifact"]["filename"] == "output_cleaned.csv"


def test_e2e_visualization_action():
    csv_data = "age,salary,department\n25,50000,Sales\n30,65000,Engineering\n35,80000,Engineering\n40,95000,Marketing\n"
    response = client.post(
        "/api/upload",
        files={"file": ("employees.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")},
    )
    assert response.status_code == 200
    file_id = response.json()["file_id"]

    action_payload = {
        "file_id": file_id,
        "action": "visualize",
        "custom_prompt": "Create an interactive scatter plot of Age vs Salary colored by Department.",
    }
    action_res = client.post("/api/action", json=action_payload)
    assert action_res.status_code == 200
    data = action_res.json()
    
    assert data["success"] is True
    assert data["generated_code"] is not None
    assert data["action"] == "visualize"
    assert data["artifact"] is not None
    assert data["artifact"]["file_type"] == "html"
