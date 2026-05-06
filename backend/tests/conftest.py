"""
File: conftest.py

Purpose:
Provides shared test fixtures used across all test files in the
backend test suite, including the test client, database setup,
demo data, authentication tokens, and helper objects.

Responsibilities:
- Set up a separate SQLite test database for each test function
  so tests never touch the real database and always start clean
- Override the get_db dependency so the app uses the test database
  during tests instead of the production one
- Tear down and recreate all tables before and after each test
  to ensure tests are fully isolated from each other
- Provide a farmer_data fixture with valid registration data for
  use across farmer auth and scanner tests
- Provide a researcher_data fixture with valid registration data
  for use across researcher auth and dashboard tests
- Provide farmer_token and researcher_token fixtures that register
  and log in the demo users and return their JWT tokens
- Provide farmer_auth_headers and researcher_auth_headers fixtures
  that wrap the tokens in the correct Authorization header format
  ready to pass into protected endpoint requests
- Provide a created_post fixture that creates a demo blog post
  as a logged in farmer for use in post and comment tests
- Provide test image fixtures for scanner upload tests including
  a standard fake image and a large image for size limit testing

Layer:
Backend (Tests / Configuration)

Related:
- app/main.py (the FastAPI app used to create the test client)
- app/database.py (Base and get_db overridden by this file)
- all test files in backend/tests (use the fixtures defined here)
- farmer_auth.py in routers (register and login endpoints called
  by farmer_token fixture)
- researcher_auth.py in routers (register and login endpoints called
  by researcher_token fixture)
- post_router.py (used by created_post fixture to create a demo post)
"""

import os
import sys
import io
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from app.main import app
from app.database import Base, get_db


TEST_DATABASE_URL = "sqlite:///./test_envmonitor.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def farmer_data():
    return {
        "first_name": "Thabo",
        "last_name": "Mokoena",
        "email": "thabo@example.com",
        "experience": "3-5 years",
        "location": "Cape Town",
        "password": "StrongPass1$"
    }


@pytest.fixture
def researcher_data():
    return {
        "email": "naledi@example.com",
        "first_name": "Naledi",
        "last_name": "Khuzwayo",
        "org_code": "1234",
        "connection_end": "2027-12-31",
        "password": "StrongPass1$"
    }


@pytest.fixture
def farmer_token(client, farmer_data):
    client.post("/auth/farmers/register", json=farmer_data)

    response = client.post(
        "/auth/farmers/login",
        json={
            "email": farmer_data["email"],
            "password": farmer_data["password"]
        }
    )

    return response.json()["access_token"]


@pytest.fixture
def researcher_token(client, researcher_data):
    client.post("/auth/researchers/register", json=researcher_data)

    response = client.post(
        "/auth/researchers/login",
        json={
            "email": researcher_data["email"],
            "org_code": researcher_data["org_code"],
            "password": researcher_data["password"]
        }
    )

    return response.json()["access_token"]


@pytest.fixture
def farmer_auth_headers(farmer_token):
    return {"Authorization": f"Bearer {farmer_token}"}


@pytest.fixture
def researcher_auth_headers(researcher_token):
    return {"Authorization": f"Bearer {researcher_token}"}


@pytest.fixture
def created_post(client, farmer_auth_headers):
    response = client.post(
        "/posts/",
        json={
            "title": "Water monitoring in Cape Town",
            "content": "Testing soil moisture data collection."
        },
        headers=farmer_auth_headers
    )
    return response.json()



@pytest.fixture
def test_image_file():
    return io.BytesIO(b"fake image data")


@pytest.fixture
def large_test_image():
    return io.BytesIO(b"a" * 5_000_000)  