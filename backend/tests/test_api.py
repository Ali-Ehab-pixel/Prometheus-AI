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
