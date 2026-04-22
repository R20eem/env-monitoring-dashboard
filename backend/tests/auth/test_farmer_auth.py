def test_register_farmer_success(client, farmer_data):
    response = client.post("/auth/farmers/register", json=farmer_data)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == farmer_data["email"]
    assert data["role"] == "farmer"
    assert "id" in data


def test_register_farmer_duplicate_email(client, farmer_data):
    client.post("/auth/farmers/register", json=farmer_data)

    response = client.post("/auth/farmers/register", json=farmer_data)

    assert response.status_code == 400
    assert response.json()["detail"] == "Farmer email already registered"


def test_register_farmer_invalid_email(client, farmer_data):
    bad_data = {**farmer_data, "email": "not-an-email"}

    response = client.post("/auth/farmers/register", json=bad_data)

    assert response.status_code == 422


def test_register_farmer_invalid_experience(client, farmer_data):
    bad_data = {**farmer_data, "experience": "10 years"}

    response = client.post("/auth/farmers/register", json=bad_data)

    assert response.status_code == 422


def test_register_farmer_weak_password_no_uppercase(client, farmer_data):
    bad_data = {**farmer_data, "password": "strongpass1$"}

    response = client.post("/auth/farmers/register", json=bad_data)

    assert response.status_code == 422
    assert "uppercase" in str(response.json())


def test_register_farmer_weak_password_no_lowercase(client, farmer_data):
    bad_data = {**farmer_data, "password": "STRONGPASS1$"}

    response = client.post("/auth/farmers/register", json=bad_data)

    assert response.status_code == 422
    assert "lowercase" in str(response.json())


def test_register_farmer_weak_password_no_number(client, farmer_data):
    bad_data = {**farmer_data, "password": "StrongPass$"}

    response = client.post("/auth/farmers/register", json=bad_data)

    assert response.status_code == 422
    assert "number" in str(response.json())


def test_register_farmer_weak_password_no_special_char(client, farmer_data):
    bad_data = {**farmer_data, "password": "StrongPass1"}

    response = client.post("/auth/farmers/register", json=bad_data)

    assert response.status_code == 422
    assert "special character" in str(response.json())


def test_login_farmer_success(client, farmer_data):
    client.post("/auth/farmers/register", json=farmer_data)

    response = client.post(
        "/auth/farmers/login",
        json={
            "email": farmer_data["email"],
            "password": farmer_data["password"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_farmer_wrong_password(client, farmer_data):
    client.post("/auth/farmers/register", json=farmer_data)

    response = client.post(
        "/auth/farmers/login",
        json={
            "email": farmer_data["email"],
            "password": "WrongPass1$",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid farmer credentials"


def test_login_farmer_unknown_email(client, farmer_data):
    response = client.post(
        "/auth/farmers/login",
        json={
            "email": "unknown@example.com",
            "password": farmer_data["password"],
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid farmer credentials"


def test_login_farmer_invalid_email_format(client):
    response = client.post(
        "/auth/farmers/login",
        json={
            "email": "bad-email",
            "password": "StrongPass1$",
        },
    )

    assert response.status_code == 422