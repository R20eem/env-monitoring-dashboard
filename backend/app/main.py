from fastapi import FastAPI
from dotenv import load_dotenv

from app.database import Base, engine

# import models so tables are created
from app.models.farmer import Farmer
from app.models.researcher import Researcher

from app.routers.farmer_auth import router as farmer_auth_router
from app.routers.researcher_auth import router as researcher_auth_router
from app.routers.ui_router import router as ui_router
from app.routers.me_router import router as me_router

load_dotenv()

app = FastAPI(title="Env Monitoring API")

Base.metadata.create_all(bind=engine)

# register the routers with the app
# each router contains a group of endpoints
# this keeps the project organised
app.include_router(farmer_auth_router)
app.include_router(researcher_auth_router)
app.include_router(ui_router)
app.include_router(me_router)

# simple root endpoint just to confirm the API is running
# if you open http://127.0.0.1:8000/ you should see this message
@app.get("/")
def root():
    return {"message": "API is running"}