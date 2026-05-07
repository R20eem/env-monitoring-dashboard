"""
File: test_token_endpoint.py

Purpose:
Contains automated tests for the /auth/token endpoint which is
used by Swagger UI to authenticate and test protected endpoints
during development.

Responsibilities:
- Test that a registered farmer can obtain a valid JWT token
  through the /auth/token endpoint using their email and password
  sent as form data
- Test that the endpoint returns a 401 error with a clear message
  when invalid credentials are provided

Layer:
Backend (Tests / Auth)

Related:
- me_router.py (the /auth/token endpoint being tested lives here)
- farmer_auth_service.py (login_farmer called by the token endpoint)
- conftest.py (provides the client and farmer_data fixtures used
  in these tests)
"""

def test_swagger_token_endpoint_farmer_success(client, farmer_data):
    client.post("/auth/farmers/register", json=farmer_data)

    response = client.post(
        "/auth/token",
        data={
            "username": farmer_data["email"],
            "password": farmer_data["password"],
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_swagger_token_endpoint_invalid_credentials(client):
    response = client.post(
        "/auth/token",
        data={
            "username": "unknown@example.com",
            "password": "WrongPass1$",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials for Swagger token login"