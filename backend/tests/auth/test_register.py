FARMER_JSON_BODY = {
    "first_name": "Test",
    "last_name": "User",
    "email": "user@example.com",
    "experience": "5+ years",
    "location": "Test Farm",
    "password": "Password1!",
}


def test_register_success(client):
    r = client.post(
        "/auth/farmers/register",
        json=FARMER_JSON_BODY
    )
    assert r.status_code == 201
    data = r.json()
    assert "id" in data
    assert data["email"] == "user@example.com"


def test_register_duplicate_email_returns_400(client):
    client.post(
        "/auth/farmers/register",
        json=FARMER_JSON_BODY
    )

    r = client.post(
        "/auth/farmers/register",
        json=FARMER_JSON_BODY
    )
    assert r.status_code == 400
    assert "detail" in r.json()
    assert "already" in r.json()["detail"].lower()


def test_register_missing_email_422(client):
    body = {**FARMER_JSON_BODY}
    del body["email"]
    r = client.post("/auth/farmers/register", json=body)
    assert r.status_code == 422


def test_register_missing_password_422(client):
    body = {**FARMER_JSON_BODY}
    del body["password"]
    r = client.post("/auth/farmers/register", json=body)
    assert r.status_code == 422


def test_register_invalid_email_format_422(client):
    r = client.post("/auth/farmers/register", json={**FARMER_JSON_BODY, "email": "not-an-email"})
    assert r.status_code == 422


def test_register_password_too_short_422(client):
    r = client.post("/auth/farmers/register", json={**FARMER_JSON_BODY, "email": "short@example.com", "password": "P1!a"})
    assert r.status_code == 422


def test_register_password_missing_uppercase_422(client):
    r = client.post("/auth/farmers/register", json={**FARMER_JSON_BODY, "email": "noupper@example.com", "password": "password1!"})
    assert r.status_code == 422


def test_register_password_missing_lowercase_422(client):
    r = client.post("/auth/farmers/register", json={**FARMER_JSON_BODY, "email": "nolower@example.com", "password": "PASSWORD1!"})
    assert r.status_code == 422


def test_register_password_missing_number_422(client):
    r = client.post("/auth/farmers/register", json={**FARMER_JSON_BODY, "email": "nonumber@example.com", "password": "Password!!"})
    assert r.status_code == 422


def test_register_password_missing_special_char_422(client):
    r = client.post("/auth/farmers/register", json={**FARMER_JSON_BODY, "email": "nospecial@example.com", "password": "Password12"})
    assert r.status_code == 422