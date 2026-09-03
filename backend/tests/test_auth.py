import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_auth_full_lifecycle():
    test_email = f"testuser_{pytest.importorskip('uuid').uuid4().hex[:8]}@example.com"
    
    # 1. Register User
    reg_payload = {
        "full_name": "Sarah Connor",
        "email": test_email,
        "password": "Password123!",
        "phone_number": "+1 555-0199",
        "country": "United States",
        "job_title": "Lead Data Scientist",
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["success"] is True
    assert reg_data["access_token"] is not None
    assert reg_data["user"]["full_name"] == "Sarah Connor"
    assert reg_data["user"]["job_title"] == "Lead Data Scientist"
    assert reg_data["user"]["country"] == "United States"
    token = reg_data["access_token"]

    # 2. Get Profile (/api/auth/me)
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == test_email
    assert me_data["phone_number"] == "+1 555-0199"

    # 3. Update Profile (/api/auth/me)
    upd_payload = {
        "job_title": "Principal AI Architect",
        "country": "Canada",
    }
    upd_res = client.put("/api/auth/me", json=upd_payload, headers={"Authorization": f"Bearer {token}"})
    assert upd_res.status_code == 200
    upd_data = upd_res.json()
    assert upd_data["job_title"] == "Principal AI Architect"
    assert upd_data["country"] == "Canada"

    # 4. Login User
    login_payload = {
        "email": test_email,
        "password": "Password123!",
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    assert login_data["access_token"] is not None
    assert login_data["user"]["job_title"] == "Principal AI Architect"

    # 5. Duplicate Email Check
    dup_res = client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code == 400
