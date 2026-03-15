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