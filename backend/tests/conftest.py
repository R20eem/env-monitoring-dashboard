import os
import sys
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