def test_register_researcher(client, researcher_data):
    response = client.post("/auth/researchers/register", json=researcher_data)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "naledi@example.com"
    assert data["role"] == "researcher"


def test_login_researcher(client, researcher_data):
    client.post("/auth/researchers/register", json=researcher_data)

    response = client.post(
        "/auth/researchers/login",
        json={
            "email": researcher_data["email"],
            "org_code": researcher_data["org_code"],
            "password": researcher_data["password"]
        },
    )

    assert response.status_code == 200
    assert "access_token" in response.json()