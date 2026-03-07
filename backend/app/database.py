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