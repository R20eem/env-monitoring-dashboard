"""
File: test_posts.py

Purpose:
Tests blog post endpoints.

Responsibilities:
- Create posts
- Retrieve posts
- Validate authentication and errors

Layer:
Backend (Testing)

Related:
- post_router.py
- post_service.py
"""


def test_get_posts_empty(client):
    response = client.get("/posts/")
    assert response.status_code == 200
    assert response.json() == []


def test_create_post_success(client, farmer_auth_headers):
    response = client.post(
        "/posts/",
        json={"title": "Test", "content": "Content"},
        headers=farmer_auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test"


def test_get_single_post(client, created_post):
    response = client.get(f"/posts/{created_post['id']}")
    assert response.status_code == 200


def test_get_post_not_found(client):
    response = client.get("/posts/99999")
    assert response.status_code == 404


def test_create_post_requires_auth(client):
    response = client.post(
        "/posts/",
        json={"title": "Test", "content": "Content"}
    )
    assert response.status_code == 401