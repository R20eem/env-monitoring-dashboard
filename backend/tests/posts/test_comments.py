def test_comment_on_post(client, farmer_auth_headers, created_post):
    post_id = created_post["id"]

    response = client.post(
        f"/posts/{post_id}/comments",
        json={"content": "Very helpful update."},
        headers=farmer_auth_headers
    )

    assert response.status_code == 201
    assert response.json()["content"] == "Very helpful update."