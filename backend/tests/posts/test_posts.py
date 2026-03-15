def test_create_post(client, farmer_auth_headers):
    response = client.post(
        "/posts/",
        json={
            "title": "Water monitoring in Cape Town",
            "content": "Testing soil moisture data collection."
        },
        headers=farmer_auth_headers
    )

    assert response.status_code == 201
    assert response.json()["title"] == "Water monitoring in Cape Town"