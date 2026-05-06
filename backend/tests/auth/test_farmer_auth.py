"""
File: test_farmer_auth.py

Purpose:
Contains all automated tests for the farmer registration and login
endpoints, covering both successful flows and expected failure cases.

Responsibilities:
- Test that a farmer can register successfully and the correct
  id, email, and role are returned
- Test that registering with a duplicate email returns a 400 error
- Test that invalid email format, invalid experience level, and
  weak passwords (missing uppercase, lowercase, number, or special
  character) all return 422 validation errors
- Test that a registered farmer can log in successfully and receive
  a valid JWT token with the correct token type
- Test that login fails with the correct 401 error when the password
  is wrong or the email does not exist
- Test that login with an invalid email format returns a 422 error

Layer:
Backend (Tests / Auth)

Related:
- farmer_auth.py in routers (the endpoints being tested)
- farmer_auth_service.py (business logic being exercised by the tests)
- farmer_repository.py (database layer used during test execution)
- schemas/farmer_auth.py (validation rules tested by the weak
  password and invalid input test cases)
- conftest.py (provides the client and farmer_data fixtures used
  across all tests in this file)
"""

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