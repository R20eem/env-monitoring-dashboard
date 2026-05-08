"""
File: common.py (schemas)

Purpose:
Defines shared response schemas used across both farmer and researcher
authentication endpoints.

Responsibilities:
- Provide a standard TokenResponse shape returned after a successful
  login for both farmers and researchers
- Provide a standard MeResponse shape returned after a successful
  registration, containing the new user's id, email, and role
- Keep shared schemas in one place to avoid duplication across
  farmer and researcher schema files

Layer:
Backend (Schema / Data Validation)

Related:
- farmer_auth.py in routers (returns MeResponse on register,
  TokenResponse on login)
- researcher_auth.py in routers (same, for researcher side)
- me_router.py (uses MeResponse as the base for the /auth/me endpoint)
- core/security.py (creates the JWT token stored in access_token)
- auth.js (frontend reads the access_token from the login response)

Reference:

ChatGPT and Claude were used during the development of this 

file to support debugging and to clarify concepts needed to implement specific 

features. All code was written, reviewed, and tested by the development team.

ChatGPT (2026) ChatGPT [AI assistant]. OpenAI. Available at: https://chat.openai.com (Accessed: May 2026).

Claude (2026) Claude [AI assistant]. Anthropic. Available at: https://claude.ai (Accessed: May 2026).

"""

from pydantic import BaseModel, EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    id: int
    email: EmailStr
    role: str