def test_register_farmer(client, farmer_data):
    response = client.post("/auth/farmers/register", json=farmer_data)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "thabo@example.com"
    assert data["role"] == "farmer"


def test_login_farmer(client, farmer_data):
    client.post("/auth/farmers/register", json=farmer_data)

    response = client.post(
        "/auth/farmers/login",
        json={
            "email": farmer_data["email"],
            "password": farmer_data["password"]
        },
    )

    assert response.status_code == 200
    assert "access_token" in response.json()