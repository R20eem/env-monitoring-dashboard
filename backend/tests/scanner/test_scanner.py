"""
File: test_scanner.py

Purpose:
Tests the ML scanner endpoints.

Responsibilities:
- Validate image upload
- Check prediction response
- Test error handling and validation
- Ensure correct data structure

Layer:
Backend (Testing)

Related:
- scanner routes
- ML model service
"""

from io import BytesIO
from types import SimpleNamespace
import pytest

import app.routers.scanner_router as scanner_router


def mock_farmer():
    return SimpleNamespace(id=1, email="farmer@test.com")


def setup_valid_farmer_auth(monkeypatch):
    monkeypatch.setattr(scanner_router, "decode_access_token", lambda token: ("farmer@test.com", "farmer"))
    monkeypatch.setattr(scanner_router, "get_farmer_by_email", lambda db, email: mock_farmer())


def setup_mock_prediction(monkeypatch):
    monkeypatch.setattr(
        scanner_router,
        "predict_crop_condition",
        lambda crop_type, image_path: ("healthy", 0.88, "model matched healthy patterns")
    )


def upload_file():
    return BytesIO(b"fake image data")


def test_upload_scan_success(client, monkeypatch):
    setup_valid_farmer_auth(monkeypatch)
    setup_mock_prediction(monkeypatch)

    response = client.post(
        "/api/scanner/upload",
        headers={"authorization": "Bearer valid-token"},
        data={"crop_type": "maize", "site_id": "1"},
        files={"file": ("test.jpg", upload_file(), "image/jpeg")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["prediction"] == "healthy"
    assert data["confidence"] == 0.88
    assert "reason" in data


def test_upload_scan_invalid_crop_type(client, monkeypatch):
    setup_valid_farmer_auth(monkeypatch)

    response = client.post(
        "/api/scanner/upload",
        headers={"authorization": "Bearer valid-token"},
        data={"crop_type": "banana", "site_id": "1"},
        files={"file": ("test.jpg", upload_file(), "image/jpeg")},
    )

    assert response.status_code == 400


def test_upload_scan_requires_auth(client):
    response = client.post(
        "/api/scanner/upload",
        data={"crop_type": "maize", "site_id": "1"},
        files={"file": ("test.jpg", upload_file(), "image/jpeg")},
    )

    assert response.status_code == 401


def test_upload_scan_invalid_auth_header(client):
    response = client.post(
        "/api/scanner/upload",
        headers={"authorization": "Invalid token"},
        data={"crop_type": "maize", "site_id": "1"},
        files={"file": ("test.jpg", upload_file(), "image/jpeg")},
    )

    assert response.status_code == 401


def test_upload_scan_invalid_token(client, monkeypatch):
    monkeypatch.setattr(scanner_router, "decode_access_token", lambda token: (_ for _ in ()).throw(Exception()))

    response = client.post(
        "/api/scanner/upload",
        headers={"authorization": "Bearer bad-token"},
        data={"crop_type": "maize", "site_id": "1"},
        files={"file": ("test.jpg", upload_file(), "image/jpeg")},
    )

    assert response.status_code == 401


def test_upload_scan_researcher_not_allowed(client, monkeypatch):
    monkeypatch.setattr(scanner_router, "decode_access_token", lambda token: ("researcher@test.com", "researcher"))

    response = client.post(
        "/api/scanner/upload",
        headers={"authorization": "Bearer researcher-token"},
        data={"crop_type": "maize", "site_id": "1"},
        files={"file": ("test.jpg", upload_file(), "image/jpeg")},
    )

    assert response.status_code == 403


def test_upload_scan_missing_file(client, monkeypatch):
    setup_valid_farmer_auth(monkeypatch)

    response = client.post(
        "/api/scanner/upload",
        headers={"authorization": "Bearer valid-token"},
        data={"crop_type": "maize", "site_id": "1"},
    )

    assert response.status_code == 422


def test_upload_scan_missing_crop_type(client, monkeypatch):
    setup_valid_farmer_auth(monkeypatch)

    response = client.post(
        "/api/scanner/upload",
        headers={"authorization": "Bearer valid-token"},
        data={"site_id": "1"},
        files={"file": ("test.jpg", upload_file(), "image/jpeg")},
    )

    assert response.status_code == 422


def test_upload_scan_missing_site_id(client, monkeypatch):
    setup_valid_farmer_auth(monkeypatch)

    response = client.post(
        "/api/scanner/upload",
        headers={"authorization": "Bearer valid-token"},
        data={"crop_type": "maize"},
        files={"file": ("test.jpg", upload_file(), "image/jpeg")},
    )

    assert response.status_code == 422


def test_get_recent_scans_empty(client):
    response = client.get("/api/scanner/recent")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_recent_scans_after_upload(client, monkeypatch):
    setup_valid_farmer_auth(monkeypatch)
    setup_mock_prediction(monkeypatch)

    client.post(
        "/api/scanner/upload",
        headers={"authorization": "Bearer valid-token"},
        data={"crop_type": "maize", "site_id": "1"},
        files={"file": ("test.jpg", upload_file(), "image/jpeg")},
    )

    response = client.get("/api/scanner/recent")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_my_scans_requires_auth(client):
    response = client.get("/api/scanner/my-scans")

    assert response.status_code == 401


def test_get_my_scans_success(client, monkeypatch):
    setup_valid_farmer_auth(monkeypatch)

    response = client.get(
        "/api/scanner/my-scans",
        headers={"authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_my_summary_requires_auth(client):
    response = client.get("/api/scanner/my-summary")

    assert response.status_code == 401


def test_get_my_summary_empty(client, monkeypatch):
    setup_valid_farmer_auth(monkeypatch)

    response = client.get(
        "/api/scanner/my-summary",
        headers={"authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    assert "total_scans" in response.json()


def test_get_my_summary_after_upload(client, monkeypatch):
    setup_valid_farmer_auth(monkeypatch)
    setup_mock_prediction(monkeypatch)

    client.post(
        "/api/scanner/upload",
        headers={"authorization": "Bearer valid-token"},
        data={"crop_type": "maize", "site_id": "1"},
        files={"file": ("test.jpg", upload_file(), "image/jpeg")},
    )

    response = client.get(
        "/api/scanner/my-summary",
        headers={"authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "total_scans" in data
    assert "healthy_count" in data