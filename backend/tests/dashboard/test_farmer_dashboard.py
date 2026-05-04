"""
File: test_farmer_dashboard.py

Purpose:
Tests the farmer dashboard endpoints.

Responsibilities:
- Verify dashboard summary responses
- Check latest sensor data retrieval
- Test representative dashboard endpoints

Layer:
Backend (Testing)

Related:
- farmer dashboard routes
- sensor reading repository
"""


def test_farmer_summary_empty(client):
    response = client.get("/api/dashboard/summary")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_farmer_temperature_latest(client):
    # Representative test for similar endpoints such as humidity, rainfall, pest count, etc.
    response = client.get("/api/dashboard/temperature/latest")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_farmer_invalid_dashboard_endpoint(client):
    response = client.get("/api/dashboard/invalid-endpoint")

    assert response.status_code == 404