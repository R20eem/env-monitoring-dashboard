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
"""

class AuthError(Exception):
    """
    error used for authentication related problems
    for example: wrong password, user not found, email already exists
    services can raise this error and the router will convert it into an HTTP response
    """
    pass
