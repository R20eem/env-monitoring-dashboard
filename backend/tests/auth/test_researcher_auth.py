def test_register_researcher_success(client, researcher_data):
    response = client.post("/auth/researchers/register", json=researcher_data)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == researcher_data["email"]
    assert data["role"] == "researcher"
    assert "id" in data


def test_register_researcher_duplicate_email(client, researcher_data):
    client.post("/auth/researchers/register", json=researcher_data)

    response = client.post("/auth/researchers/register", json=researcher_data)

    assert response.status_code == 400
    assert response.json()["detail"] == "Researcher email already registered"


def test_register_researcher_invalid_email(client, researcher_data):
    bad_data = {**researcher_data, "email": "not-an-email"}

    response = client.post("/auth/researchers/register", json=bad_data)

    assert response.status_code == 422


def test_register_researcher_invalid_org_code_letters(client, researcher_data):
    bad_data = {**researcher_data, "org_code": "12AB"}

    response = client.post("/auth/researchers/register", json=bad_data)

    assert response.status_code == 422
    assert "org_code must be exactly 4 digits" in str(response.json())


def test_register_researcher_invalid_org_code_length(client, researcher_data):
    bad_data = {**researcher_data, "org_code": "123"}

    response = client.post("/auth/researchers/register", json=bad_data)

    assert response.status_code == 422


def test_register_researcher_invalid_connection_end_format(client, researcher_data):
    bad_data = {**researcher_data, "connection_end": "31-12-2027"}

    response = client.post("/auth/researchers/register", json=bad_data)

    assert response.status_code == 400
    assert response.json()["detail"] == "connection_end must be in YYYY-MM-DD format"


def test_register_researcher_weak_password_no_uppercase(client, researcher_data):
    bad_data = {**researcher_data, "password": "strongpass1$"}

    response = client.post("/auth/researchers/register", json=bad_data)

    assert response.status_code == 422
    assert "uppercase" in str(response.json())


def test_register_researcher_weak_password_no_lowercase(client, researcher_data):
    bad_data = {**researcher_data, "password": "STRONGPASS1$"}

    response = client.post("/auth/researchers/register", json=bad_data)

    assert response.status_code == 422
    assert "lowercase" in str(response.json())


def test_register_researcher_weak_password_no_number(client, researcher_data):
    bad_data = {**researcher_data, "password": "StrongPass$"}

    response = client.post("/auth/researchers/register", json=bad_data)

    assert response.status_code == 422
    assert "number" in str(response.json())


def test_register_researcher_weak_password_no_special_char(client, researcher_data):
    bad_data = {**researcher_data, "password": "StrongPass1"}

    response = client.post("/auth/researchers/register", json=bad_data)

    assert response.status_code == 422
    assert "special character" in str(response.json())


def test_login_researcher_success(client, researcher_data):
    client.post("/auth/researchers/register", json=researcher_data)

    response = client.post(
        "/auth/researchers/login",
        json={
            "email": researcher_data["email"],
            "org_code": researcher_data["org_code"],
            "password": researcher_data["password"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_researcher_wrong_password(client, researcher_data):
    client.post("/auth/researchers/register", json=researcher_data)

    response = client.post(
        "/auth/researchers/login",
        json={
            "email": researcher_data["email"],
            "org_code": researcher_data["org_code"],
            "password": "WrongPass1$",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid researcher credentials"


def test_login_researcher_wrong_org_code(client, researcher_data):
    client.post("/auth/researchers/register", json=researcher_data)

    response = client.post(
        "/auth/researchers/login",
        json={
            "email": researcher_data["email"],
            "org_code": "9999",
            "password": researcher_data["password"],
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid researcher credentials"


def test_login_researcher_unknown_email(client, researcher_data):
    response = client.post(
        "/auth/researchers/login",
        json={
            "email": "unknown@example.com",
            "org_code": researcher_data["org_code"],
            "password": researcher_data["password"],
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid researcher credentials"


def test_login_researcher_invalid_org_code_format(client, researcher_data):
    response = client.post(
        "/auth/researchers/login",
        json={
            "email": researcher_data["email"],
            "org_code": "12AB",
            "password": researcher_data["password"],
        },
    )

    assert response.status_code == 422


def test_login_researcher_expired_connection(client, researcher_data):
    expired_data = {**researcher_data, "connection_end": "2020-01-01"}
    client.post("/auth/researchers/register", json=expired_data)

    response = client.post(
        "/auth/researchers/login",
        json={
            "email": expired_data["email"],
            "org_code": expired_data["org_code"],
            "password": expired_data["password"],
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Your organization connection has ended"