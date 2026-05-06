"""
File: test_me_router.py

Purpose:
Contains all automated tests for the shared authentication endpoints
covering profile retrieval and password management for both farmers
and researchers.

Responsibilities:
- Test that GET /auth/me returns the correct profile fields for a
  logged in farmer including email, role, name, location and experience
- Test that GET /auth/me returns the correct profile fields for a
  logged in researcher including email, role, name, org code and
  connection end date
- Test that GET /auth/me returns a 401 or 403 error when no token
  is provided
- Test that GET /auth/me returns a 401 error when an invalid or
  malformed token is sent
- Test that a farmer can successfully change their password and that
  the old password no longer works while the new one does
- Test that changing a password fails with a 400 error when the
  current password provided is incorrect

Layer:
Backend (Tests / Auth)

Related:
- me_router.py (the endpoints being tested)
- core/security.py (token decoding tested indirectly by invalid
  token test cases)
- farmer_auth_service.py (login used to verify password change worked)
- conftest.py (provides client, farmer_auth_headers, researcher_auth_headers,
  farmer_data and researcher_data fixtures used across all tests)
"""
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


def test_change_password_farmer_success(client, farmer_auth_headers, farmer_data):
    new_pw = "NewStrong9$"
    res = client.put(
        "/auth/change-password",
        headers=farmer_auth_headers,
        json={"current_password": farmer_data["password"], "new_password": new_pw},
    )
    assert res.status_code == 200
    assert res.json()["message"] == "Password updated successfully"

    old_login = client.post(
        "/auth/farmers/login",
        json={"email": farmer_data["email"], "password": farmer_data["password"]},
    )
    assert old_login.status_code == 401

    new_login = client.post(
        "/auth/farmers/login",
        json={"email": farmer_data["email"], "password": new_pw},
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()


def test_change_password_rejects_wrong_current(client, farmer_auth_headers):
    res = client.put(
        "/auth/change-password",
        headers=farmer_auth_headers,
        json={"current_password": "wrong-password", "new_password": "AnotherStr9$"},
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "Current password is incorrect"