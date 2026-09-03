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
        "custom_prompt": "Fill missing values, standardize columns, and save as CSV.",
        "output_format": "csv",
    }
    action_res = client.post("/api/action", json=action_payload)
    assert action_res.status_code == 200
    data = action_res.json()
    if not data["success"]:
        print("\n[CLEAN FAILED]:", data.get("error"), "\nSTDERR:\n", data.get("stderr"), "\nCODE:\n", data.get("generated_code"))
    assert data["success"] is True
    assert data["artifact"] is not None


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
        "custom_prompt": "Create an interactive scatter plot of Age vs Salary colored by Department with Plotly Express.",
    }
    action_res = client.post("/api/action", json=action_payload)
    assert action_res.status_code == 200
    data = action_res.json()
    if not data["success"]:
        print("\n[VIZ FAILED]:", data.get("error"), "\nSTDERR:\n", data.get("stderr"), "\nCODE:\n", data.get("generated_code"))
    assert data["success"] is True
    assert data["artifact"] is not None
    assert data["artifact"]["file_type"] == "html"


def test_e2e_predict_action():
    csv_data = """age,experience,salary,churn
25,1,50000,0
30,5,70000,0
35,10,90000,0
40,15,110000,1
45,20,130000,1
28,3,60000,0
50,22,140000,1
32,6,75000,0
"""
    response = client.post(
        "/api/upload",
        files={"file": ("churn_data.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")},
    )
    assert response.status_code == 200
    file_id = response.json()["file_id"]

    action_payload = {
        "file_id": file_id,
        "action": "predict",
        "target_column": "churn",
        "custom_prompt": "Train a baseline classifier for target 'churn' and append predictions to the dataset.",
        "output_format": "csv",
    }
    action_res = client.post("/api/action", json=action_payload)
    assert action_res.status_code == 200
    data = action_res.json()
    if not data["success"]:
        print("\n[PREDICT FAILED]:", data.get("error"), "\nSTDERR:\n", data.get("stderr"), "\nCODE:\n", data.get("generated_code"))
    assert data["success"] is True
    assert data["artifact"] is not None
