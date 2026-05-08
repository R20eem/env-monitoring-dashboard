#  Eco Leaf — Environmental Monitoring Dashboard

A smart crop health monitoring platform built for small-scale farmers and 
agricultural researchers in South Africa. Eco Leaf provides real-time pest 
and disease alerts, an ML-powered plant scanner, a community blog connecting 
farmers with researchers, and an advanced analytics portal for researchers.

---

## What the System Does

- **Farmer Dashboard** — colour-coded crop health status with plain-language 
  alerts, simple and detailed views
- **ML Plant Scanner** — upload a crop photo and get an instant prediction, 
  confidence score, and plain-language explanation
- **Community Blog** — farmers and researchers share posts, filter by role, 
  comment and like
- **Researcher Portal** — advanced filters, trend charts, multi-site data, 
  and CSV export
- **Afrikaans Language Support** — language toggle for Afrikaans-speaking farmers
- **Public Dashboard** — crop health status visible without login

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | FastAPI (Python) |
| Database | SQLite |
| ML Models | Random Forest, MobileNetV2 |
| Auth | JWT (HS256), pbkdf2_sha256 password hashing |
| Testing | pytest |
| CI | GitHub Actions |

---

## Getting Started

### Prerequisites
- Python 3.12+
- pip

### Installation

```bash
git clone https://github.com/R20eem/env-monitoring-dashboard.git
cd env-monitoring-dashboard/backend
pip install -r requirements.txt
```

### Seed the database

```bash
python -m app.seed.seed_sensor_readings
python -m app.seed.seed_blog
```

### Run the backend

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Run the frontend

```bash
cd ..
python3 -m http.server 5500 --directory frontend
```

Then open `http://localhost:5500/frontend/html/index.html` in your browser.

---

## Running Tests

```bash
cd backend
pytest
```

---

## Project Structure

```
env-monitoring-dashboard/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── seed/
│   │   └── main.py
│   ├── tests/
│   │   ├── auth/
│   │   ├── scanner/
│   │   ├── dashboard/
│   │   └── posts/
│   └── requirements.txt
├── frontend/
│   ├── html/
│   ├── css/
│   └── js/
└── .github/
    └── workflows/
        └── backend-ci.yml
```

---

## Documentation

Full project documentation is available on the 
[GitHub Wiki](https://github.com/R20eem/env-monitoring-dashboard/wiki).

---

## Team

Built by a student team at the University of Leeds — COMP2850 
Software Engineering, 2026.

---

## AI Assistance

ChatGPT and Claude were used throughout development in an assistive role for 
debugging and understanding concepts. All code was written, reviewed, and tested 
by the development team in accordance with the COMP2850 AI use policy.

ChatGPT (2026) ChatGPT [AI assistant]. OpenAI. Available at: https://chat.openai.com (Accessed: May 2026).  
Claude (2026) Claude [AI assistant]. Anthropic. Available at: https://claude.ai (Accessed: May 2026).