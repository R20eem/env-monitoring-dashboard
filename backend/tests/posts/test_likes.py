def test_like_post(client, farmer_auth_headers, created_post):
    post_id = created_post["id"]

    response = client.post(
        f"/posts/{post_id}/like",
        headers=farmer_auth_headers
    )

    assert response.status_code == 200
    assert response.json()["likes_count"] == 1