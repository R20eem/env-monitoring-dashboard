FARMER_JSON_BODY = {
    "first_name": "Test",
    "last_name": "User",
    "email": "user@example.com",
    "experience": "5+ years",
    "location": "Test Farm",
    "password": "Password1!",
}


def _register_and_login(client, email="me@example.com", password="Password1!"):
    client.post("/auth/farmers/register", json={**FARMER_JSON_BODY, "email": email, "password": password})
    r = client.post("/auth/farmers/login", json={"email": email, "password": password})
    assert r.status_code == 200
    return r.json()["access_token"]


def test_me_requires_token_401(client):
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_me_rejects_invalid_token_401(client):
    r = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert r.status_code == 401
    assert "detail" in r.json()


def test_me_success_returns_user(client):
    token = _register_and_login(client, email="me-ok@example.com")

    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200

    data = r.json()
    assert "id" in data
    assert data["email"] == "me-ok@example.com"