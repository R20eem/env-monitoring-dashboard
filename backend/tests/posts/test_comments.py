"""
File: test_comments.py

Purpose:
Tests comment functionality.

Responsibilities:
- Add comments
- Retrieve comments
- Validate input and errors

Layer:
Backend (Testing)

Related:
- post_router.py
- post_service.py
"""


def test_get_comments_empty(client, created_post):
    response = client.get(f"/posts/{created_post['id']}/comments")
    assert response.status_code == 200
    assert response.json() == []


def test_add_comment_success(client, created_post, farmer_auth_headers):
    response = client.post(
        f"/posts/{created_post['id']}/comments",
        json={"content": "Nice post"},
        headers=farmer_auth_headers
    )

    assert response.status_code == 201
    assert response.json()["content"] == "Nice post"


def test_get_comments_after_add(client, created_post, farmer_auth_headers):
    client.post(
        f"/posts/{created_post['id']}/comments",
        json={"content": "Test comment"},
        headers=farmer_auth_headers
    )

    response = client.get(f"/posts/{created_post['id']}/comments")
    assert len(response.json()) == 1


def test_comment_invalid_post(client, farmer_auth_headers):
    response = client.post(
        "/posts/99999/comments",
        json={"content": "Invalid"},
        headers=farmer_auth_headers
    )
    assert response.status_code == 400


def test_comment_requires_auth(client, created_post):
    response = client.post(
        f"/posts/{created_post['id']}/comments",
        json={"content": "No auth"}
    )
    assert response.status_code == 401