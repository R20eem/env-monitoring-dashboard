def test_me_returns_farmer_profile(client, farmer_auth_headers, farmer_data):
    response = client.get("/auth/me", headers=farmer_auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == farmer_data["email"]
    assert data["role"] == "farmer"
    assert data["first_name"] == farmer_data["first_name"]
    assert data["last_name"] == farmer_data["last_name"]
    assert data["location"] == farmer_data["location"]
    assert data["experience"] == farmer_data["experience"]


def test_me_returns_researcher_profile(client, researcher_auth_headers, researcher_data):
    response = client.get("/auth/me", headers=researcher_auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == researcher_data["email"]
    assert data["role"] == "researcher"
    assert data["first_name"] == researcher_data["first_name"]
    assert data["last_name"] == researcher_data["last_name"]
    assert data["org_code"] == researcher_data["org_code"]
    assert data["connection_end"] == researcher_data["connection_end"]


def test_me_requires_token(client):
    response = client.get("/auth/me")

    assert response.status_code in [401, 403]


def test_me_rejects_invalid_token(client):
    response = client.get(
        "/auth/me",
        headers={"Authorization": "Bearer invalid.token.here"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired token"