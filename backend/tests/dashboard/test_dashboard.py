def test_farmer_summary_empty(client):
    response = client.get("/api/dashboard/summary")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_farmer_temperature_latest(client):
    response = client.get("/api/dashboard/temperature/latest")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)



# Researcher dashboard
def test_researcher_summary(client):
    response = client.get("/api/researcher/dashboard/summary")

    assert response.status_code == 200


def test_researcher_data_basic(client):
    response = client.get("/api/researcher/dashboard/data")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_researcher_data_invalid_status(client):
    response = client.get(
        "/api/researcher/dashboard/data?status=invalid"
    )

    assert response.status_code == 400
    assert "invalid status" in response.json()["detail"]


def test_researcher_data_invalid_date(client):
    response = client.get(
        "/api/researcher/dashboard/data?start_date=bad-date"
    )

    assert response.status_code == 400


def test_researcher_export(client):
    response = client.get("/api/researcher/dashboard/data/export")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")


def test_researcher_alert_history(client):
    response = client.get("/api/researcher/dashboard/alerts/history")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_researcher_alert_invalid_severity(client):
    response = client.get(
        "/api/researcher/dashboard/alerts/history?severity=bad"
    )

    assert response.status_code == 400