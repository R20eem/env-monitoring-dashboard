"""
File: main.py

Purpose:
The entry point for the FastAPI backend application, responsible
for setting up the app, registering all routers, configuring
middleware, and creating database tables on startup.

Responsibilities:
- Create the FastAPI app instance and set the API title
- Configure CORS middleware to allow the frontend to make requests
  to the backend from any origin during development
- Create all database tables on startup using SQLAlchemy metadata
  so the app is ready to use without running migrations manually
- Register all routers with the app including farmer auth,
  researcher auth, me, posts, profiles, dashboard, researcher
  dashboard, and scanner
- Serve the uploads folder as a static directory so uploaded
  scan images can be accessed directly via URL from the browser
- Provide a root endpoint at GET / to confirm the API is running

Layer:
Backend (Application Entry Point)

Related:
- database.py (provides Base and engine used to create tables)
- all files in routers (registered with the app here)
- all files in models (imported here so tables are created on startup)
- core/security.py (used by routers registered here)
- farmer_dashboard.js (connects to endpoints registered here)
- researcher.js (connects to researcher dashboard endpoints)
- scanner.js (connects to scanner endpoints and image URLs)

Reference:

ChatGPT and Claude were used during the development of this 

file to support debugging and to clarify concepts needed to implement specific 

features. All code was written, reviewed, and tested by the development team.

ChatGPT (2026) ChatGPT [AI assistant]. OpenAI. Available at: https://chat.openai.com (Accessed: May 2026).

Claude (2026) Claude [AI assistant]. Anthropic. Available at: https://claude.ai (Accessed: May 2026).

"""

import setuptools

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.database import Base, engine

# import models so tables are created
from app.models.farmer import Farmer
from app.models.researcher import Researcher
from app.models.sensor_reading import SensorReading

from app.routers.farmer_auth import router as farmer_auth_router
from app.routers.researcher_auth import router as researcher_auth_router
from app.routers.ui_router import router as ui_router
from app.routers.me_router import router as me_router

from app.models.post import Post
from app.models.post_like import PostLike
from app.models.post_comment import PostComment

from app.routers.post_router import router as post_router
from app.routers.profile_router import router as profile_router
from app.routers.dashboard_router import router as dashboard_router
from app.routers.researcher_dashboard_router import router as researcher_dashboard_router
from app.models.site_metadata import SiteMetadata
from app.models.alert_log import AlertLog

from app.routers.scanner_router import router as scanner_router
from app.models.scan_result import ScanResult
from fastapi.staticfiles import StaticFiles

load_dotenv()

app = FastAPI(title="Env Monitoring API")

# 1. Explicitly name the Live Server addresses
#origins = [
    #"http://127.0.0.1:5500",
   # "http://localhost:5500",
    #"http://192.168.0.22:5500"
#]

# 2. Give them the ultimate VIP pass
app.add_middleware(
    CORSMiddleware,
    # allow_origins=origins, # <--- Points to the list above
    allow_origins=["*"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)
# -------------------------------------------

Base.metadata.create_all(bind=engine)

# register the routers with the app
# each router contains a group of endpoints
# this keeps the project organised
app.include_router(farmer_auth_router)
app.include_router(researcher_auth_router)
app.include_router(ui_router)
app.include_router(me_router)

app.include_router(researcher_dashboard_router)
app.include_router(post_router)
app.include_router(profile_router)
app.include_router(dashboard_router)
# simple root endpoint just to confirm the API is running
# if you open http://127.0.0.1:8000/ you should see this message
@app.get("/")
def root():
    return {"message": "API is running"}

app.include_router(scanner_router)
# this makes the uploads folder public so images can be accessed from the browser
# for example a file saved as uploads/image.jpg can be opened at
# http://127.0.0.1:8000/uploads/image.jpg, or whatever server you use.
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")