"""
File: test_export.py

Purpose:
Tests the export (CSV download) functionality for the researcher dashboard.

Responsibilities:
- Verify CSV export endpoint works
- Check response type and headers
- Ensure file is downloadable
- Validate response content

Layer:
Backend (Testing)

Related:
- researcher dashboard routes
- export endpoint
"""


def test_export_success(client):
    response = client.get("/api/researcher/dashboard/data/export")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")


def test_export_has_download_header(client):
    response = client.get("/api/researcher/dashboard/data/export")

    content_disposition = response.headers.get("content-disposition", "")

    assert "attachment" in content_disposition


def test_export_not_empty(client):
    response = client.get("/api/researcher/dashboard/data/export")

    assert len(response.text) > 0


def test_export_invalid_method(client):
    response = client.post("/api/researcher/dashboard/data/export")

    assert response.status_code in [400, 405]