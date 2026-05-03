"""
File: test_likes.py

Purpose:
Tests like/unlike functionality.

Responsibilities:
- Like posts
- Unlike posts
- Prevent duplicate likes
- Validate errors

Layer:
Backend (Testing)

Related:
- post_router.py
- post_service.py
"""


def test_like_post_success(client, created_post, farmer_auth_headers):
    response = client.post(
        f"/posts/{created_post['id']}/like",
        headers=farmer_auth_headers
    )

    assert response.status_code == 200
    assert response.json()["likes_count"] == 1


def test_like_post_twice(client, created_post, farmer_auth_headers):
    client.post(f"/posts/{created_post['id']}/like", headers=farmer_auth_headers)

    response = client.post(
        f"/posts/{created_post['id']}/like",
        headers=farmer_auth_headers
    )

    assert response.status_code == 400


def test_unlike_post_success(client, created_post, farmer_auth_headers):
    client.post(f"/posts/{created_post['id']}/like", headers=farmer_auth_headers)

    response = client.delete(
        f"/posts/{created_post['id']}/like",
        headers=farmer_auth_headers
    )

    assert response.status_code == 200
    assert response.json()["likes_count"] == 0


def test_unlike_without_like(client, created_post, farmer_auth_headers):
    response = client.delete(
        f"/posts/{created_post['id']}/like",
        headers=farmer_auth_headers
    )

    assert response.status_code == 400


def test_like_invalid_post(client, farmer_auth_headers):
    response = client.post(
        "/posts/99999/like",
        headers=farmer_auth_headers
    )

    assert response.status_code == 400


def test_like_requires_auth(client, created_post):
    response = client.post(f"/posts/{created_post['id']}/like")
    assert response.status_code == 401