"""
File: database.py

Purpose:
Sets up the database connection and session management for the
entire backend, providing a shared engine, session factory, and
base class for all SQLAlchemy models.

Responsibilities:
- Read the database URL from the environment variable DATABASE_URL,
  defaulting to a local SQLite file for development
- Create the SQLAlchemy engine with the correct connection arguments
  depending on whether SQLite or another database is being used
- Provide a SessionLocal factory used to create database sessions
  throughout the application
- Provide the Base class that all models inherit from so SQLAlchemy
  can track and create the correct tables
- Provide the get_db dependency function used by FastAPI routers
  to open a database session per request and close it automatically
  when the request finishes

Layer:
Backend (Database / Infrastructure)

Related:
- all files in models (inherit from Base defined here)
- all files in routers (use Depends(get_db) to get a session)
- all files in repositories (receive the session from the router)
- seed_sensor_readings.py (uses engine and SessionLocal directly)
- seed_blog.py (uses SessionLocal and Base to seed demo data)
- main.py (imports Base and engine to create tables on startup)
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./envmonitor.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# connection to the database
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)


# create a session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    """
    this function is used by FastAPI to get a database session for each request
    routers can use it with Depends(get_db)
    FastAPI will automatically open a session and close it when the request finishes
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()