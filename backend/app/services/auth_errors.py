"""
File: auth_errors.py

Purpose:
Defines a custom exception class used across all authentication
services to signal login and registration failures in a consistent
way.

Responsibilities:
- Provide a single AuthError exception that all auth services can
  raise when something goes wrong, such as wrong password, user
  not found, or email already registered
- Keep error handling clean by separating authentication failures
  from unexpected server errors
- Allow routers to catch AuthError specifically and convert it into
  the correct HTTP response without catching unrelated exceptions

Layer:
Backend (Service / Error Handling)

Related:
- farmer_auth_service.py (raises AuthError on login and registration
  failures for farmers)
- researcher_auth_service.py (raises AuthError on login and
  registration failures for researchers)
- farmer_auth.py in routers (catches AuthError and returns 400 or
  401 HTTP responses)
- researcher_auth.py in routers (same, for researcher side)
- me_router.py (catches AuthError where relevant)

Reference:

ChatGPT and Claude were used during the development of this 

file to support debugging and to clarify concepts needed to implement specific 

features. All code was written, reviewed, and tested by the development team.

ChatGPT (2026) ChatGPT [AI assistant]. OpenAI. Available at: https://chat.openai.com (Accessed: May 2026).

Claude (2026) Claude [AI assistant]. Anthropic. Available at: https://claude.ai (Accessed: May 2026).

"""

class AuthError(Exception):
    """
    error used for authentication related problems
    for example: wrong password, user not found, email already exists
    services can raise this error and the router will convert it into an HTTP response
    """
    pass
