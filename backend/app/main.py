from fastapi import FastAPI
from dotenv import load_dotenv

from app.database import Base, engine
from app.routers.auth import router as auth_router

load_dotenv()

app = FastAPI(title="Flight Booking API")


Base.metadata.create_all(bind=engine)

# routers
app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "API is running"}