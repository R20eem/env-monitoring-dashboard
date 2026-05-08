"""
File: ui_router.py

Purpose:
Serves simple HTML test pages used during development to manually
test authentication and social features without needing the full
frontend to be running.

Responsibilities:
- Serve the authentication test UI at /ui for testing farmer and
  researcher login and registration during backend development
- Serve the demo social UI at /demo for testing blog post and
  comment functionality before the frontend was ready
- Use Jinja2 templates to render the HTML pages from the
  app/templates directory

Layer:
Backend (Router / Development UI)

Related:
- app/templates/auth_ui.html (login and registration test page)
- app/templates/demo_social_ui.html (blog and social feature test page)
- main.py (registers this router with the FastAPI app)
- farmer_auth.py (auth endpoints tested through the UI)
- post_router.py (post and comment endpoints tested through the demo page)

Reference:

ChatGPT and Claude were used during the development of this 

file to support debugging and to clarify concepts needed to implement specific 

features. All code was written, reviewed, and tested by the development team.

ChatGPT (2026) ChatGPT [AI assistant]. OpenAI. Available at: https://chat.openai.com (Accessed: May 2026).

Claude (2026) Claude [AI assistant]. Anthropic. Available at: https://claude.ai (Accessed: May 2026).

"""

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates


# router used to serve the simple testing UI
# this is not the final frontend, it just helps us test login/registration
router = APIRouter(tags=["ui"])

# tells FastAPI where the HTML templates are located
# in our case the file is inside app/templates but feel free to chabge them
templates = Jinja2Templates(directory="app/templates")

# endpoint that loads the test UI page
@router.get("/ui", response_class=HTMLResponse)
def ui_home(request: Request):
    return templates.TemplateResponse("auth_ui.html", {"request": request})

@router.get("/demo", response_class=HTMLResponse)
def demo_page(request: Request):
    return templates.TemplateResponse("demo_social_ui.html", {"request": request})