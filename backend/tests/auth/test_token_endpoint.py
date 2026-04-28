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