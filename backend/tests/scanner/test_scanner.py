from io import BytesIO


def test_upload_scan_success(client, farmer_auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.routers.scanner_router.predict_crop_condition",
        lambda crop_type, image_path: ("healthy", 0.95, "test reason")
    )

    file_obj = BytesIO(b"fake image content")

    response = client.post(
        "/api/scanner/upload",
        headers=farmer_auth_headers,
        files={"file": ("test.jpg", file_obj, "image/jpeg")},
        data={"crop_type": "maize", "site_id": 1},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["crop_type"] == "maize"
    assert data["site_id"] == 1
    assert data["prediction"] == "healthy"
    assert data["confidence"] == 0.95
    assert data["reason"] == "test reason"
    assert "id" in data
    assert "created_at" in data
    assert "image_path" in data


def test_upload_scan_invalid_crop_type(client, farmer_auth_headers):
    file_obj = BytesIO(b"fake image content")

    response = client.post(
        "/api/scanner/upload",
        headers=farmer_auth_headers,
        files={"file": ("test.jpg", file_obj, "image/jpeg")},
        data={"crop_type": "banana", "site_id": 1},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "invalid crop_type"


def test_upload_scan_requires_auth(client):
    file_obj = BytesIO(b"fake image content")

    response = client.post(
        "/api/scanner/upload",
        files={"file": ("test.jpg", file_obj, "image/jpeg")},
        data={"crop_type": "maize", "site_id": 1},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "not authenticated"


def test_upload_scan_invalid_auth_header(client):
    file_obj = BytesIO(b"fake image content")

    response = client.post(
        "/api/scanner/upload",
        headers={"Authorization": "Invalid token"},
        files={"file": ("test.jpg", file_obj, "image/jpeg")},
        data={"crop_type": "maize", "site_id": 1},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "invalid auth header"


def test_upload_scan_invalid_token(client):
    file_obj = BytesIO(b"fake image content")

    response = client.post(
        "/api/scanner/upload",
        headers={"Authorization": "Bearer invalid.token.here"},
        files={"file": ("test.jpg", file_obj, "image/jpeg")},
        data={"crop_type": "maize", "site_id": 1},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "invalid or expired token"


def test_upload_scan_researcher_not_allowed(client, researcher_auth_headers):
    file_obj = BytesIO(b"fake image content")

    response = client.post(
        "/api/scanner/upload",
        headers=researcher_auth_headers,
        files={"file": ("test.jpg", file_obj, "image/jpeg")},
        data={"crop_type": "maize", "site_id": 1},
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "only farmers allowed"


def test_upload_scan_missing_file(client, farmer_auth_headers):
    response = client.post(
        "/api/scanner/upload",
        headers=farmer_auth_headers,
        data={"crop_type": "maize", "site_id": 1},
    )

    assert response.status_code == 422


def test_upload_scan_missing_crop_type(client, farmer_auth_headers):
    file_obj = BytesIO(b"fake image content")

    response = client.post(
        "/api/scanner/upload",
        headers=farmer_auth_headers,
        files={"file": ("test.jpg", file_obj, "image/jpeg")},
        data={"site_id": 1},
    )

    assert response.status_code == 422


def test_upload_scan_missing_site_id(client, farmer_auth_headers):
    file_obj = BytesIO(b"fake image content")

    response = client.post(
        "/api/scanner/upload",
        headers=farmer_auth_headers,
        files={"file": ("test.jpg", file_obj, "image/jpeg")},
        data={"crop_type": "maize"},
    )

    assert response.status_code == 422


def test_get_recent_scans_empty(client):
    response = client.get("/api/scanner/recent")

    assert response.status_code == 200
    assert response.json() == []


def test_get_recent_scans_after_upload(client, farmer_auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.routers.scanner_router.predict_crop_condition",
        lambda crop_type, image_path: ("healthy", 0.95, "test reason")
    )

    file_obj = BytesIO(b"fake image content")

    client.post(
        "/api/scanner/upload",
        headers=farmer_auth_headers,
        files={"file": ("test.jpg", file_obj, "image/jpeg")},
        data={"crop_type": "maize", "site_id": 1},
    )

    response = client.get("/api/scanner/recent")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["prediction"] == "healthy"
    assert data[0]["crop_type"] == "maize"
    assert "image_url" in data[0]


def test_get_my_scans_requires_auth(client):
    response = client.get("/api/scanner/my-scans")

    assert response.status_code == 401


def test_get_my_scans_success(client, farmer_auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.routers.scanner_router.predict_crop_condition",
        lambda crop_type, image_path: ("healthy", 0.95, "test reason")
    )

    file_obj = BytesIO(b"fake image content")

    client.post(
        "/api/scanner/upload",
        headers=farmer_auth_headers,
        files={"file": ("test.jpg", file_obj, "image/jpeg")},
        data={"crop_type": "maize", "site_id": 1},
    )

    response = client.get(
        "/api/scanner/my-scans",
        headers=farmer_auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["prediction"] == "healthy"
    assert data[0]["crop_type"] == "maize"


def test_get_my_summary_requires_auth(client):
    response = client.get("/api/scanner/my-summary")

    assert response.status_code == 401


def test_get_my_summary_empty(client, farmer_auth_headers):
    response = client.get(
        "/api/scanner/my-summary",
        headers=farmer_auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_scans"] == 0
    assert data["healthy_count"] == 0
    assert data["pest_risk_count"] == 0
    assert data["disease_risk_count"] == 0
    assert data["latest_scan"] is None


def test_get_my_summary_after_upload(client, farmer_auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.routers.scanner_router.predict_crop_condition",
        lambda crop_type, image_path: ("healthy", 0.95, "test reason")
    )

    file_obj = BytesIO(b"fake image content")

    client.post(
        "/api/scanner/upload",
        headers=farmer_auth_headers,
        files={"file": ("test.jpg", file_obj, "image/jpeg")},
        data={"crop_type": "maize", "site_id": 1},
    )

    response = client.get(
        "/api/scanner/my-summary",
        headers=farmer_auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total_scans"] == 1
    assert data["healthy_count"] == 1
    assert data["pest_risk_count"] == 0
    assert data["disease_risk_count"] == 0
    assert data["latest_scan"]["prediction"] == "healthy"
    assert data["latest_scan"]["crop_type"] == "maize"