"""
File: test_researcher_dashboard.py

Purpose:
Tests the researcher dashboard endpoints.

Responsibilities:
- Validate data retrieval and filtering
- Test export functionality
- Check alert history endpoints
- Verify error handling for invalid inputs

Layer:
Backend (Testing)

Related:
- researcher dashboard routes
- sensor reading repository
- alert log repository
"""


def test_researcher_summary(client):
    response = client.get("/api/researcher/dashboard/summary")

    assert response.status_code == 200


def test_researcher_data_basic(client):
    response = client.get("/api/researcher/dashboard/data")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_researcher_data_empty_for_unknown_site(client):
    response = client.get("/api/researcher/dashboard/data?site_id=unknown-site")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_researcher_data_invalid_status(client):
    response = client.get("/api/researcher/dashboard/data?status=invalid")

    assert response.status_code == 400
    assert "invalid status" in response.json()["detail"]


def test_researcher_data_invalid_date(client):
    response = client.get("/api/researcher/dashboard/data?start_date=bad-date")

    assert response.status_code == 400
    assert "invalid date format" in response.json()["detail"]


def test_researcher_export(client):
    response = client.get("/api/researcher/dashboard/data/export")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")


def test_researcher_export_download_header(client):
    response = client.get("/api/researcher/dashboard/data/export")

    assert response.status_code == 200
    assert "attachment" in response.headers.get("content-disposition", "")
    assert "researcher_data.csv" in response.headers.get("content-disposition", "")


def test_researcher_alert_history(client):
    response = client.get("/api/researcher/dashboard/alerts/history")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_researcher_alert_invalid_severity(client):
    response = client.get("/api/researcher/dashboard/alerts/history?severity=bad")

    assert response.status_code == 400
    assert "invalid severity" in response.json()["detail"]