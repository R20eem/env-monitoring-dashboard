def _register_user(client, email="login@example.com", password="Password1!"):
    return client.post("/auth/register", json={"email": email, "password": password})


def test_login_success_returns_token(client):
    _register_user(client, email="login-ok@example.com")

    r = client.post(
        "/auth/login",
        json={"email": "login-ok@example.com", "password": "Password1!"},
    )
    assert r.status_code == 200

    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert isinstance(data["access_token"], str)
    assert data["access_token"].count(".") == 2


def test_login_wrong_password_401(client):
    _register_user(client, email="wrongpass@example.com")

    r = client.post(
        "/auth/login",
        json={"email": "wrongpass@example.com", "password": "WrongPass1!"},
    )
    assert r.status_code == 401
    assert "detail" in r.json()
    assert "invalid" in r.json()["detail"].lower()


def test_login_user_not_found_401(client):
    r = client.post(
        "/auth/login",
        json={"email": "missing@example.com", "password": "Password1!"},
    )
    assert r.status_code == 401
    assert "detail" in r.json()


def test_login_missing_fields_422(client):
    r = client.post("/auth/login", json={})
    assert r.status_code == 422


def test_login_invalid_email_format_422(client):
    r = client.post("/auth/login", json={"email": "bad-email", "password": "Password1!"})
    assert r.status_code == 422


def test_login_empty_password_422(client):
    r = client.post("/auth/login", json={"email": "x@example.com", "password": ""})
    assert r.status_code == 422