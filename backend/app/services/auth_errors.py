
class AuthError(Exception):
    """
    error used for authentication related problems
    for example: wrong password, user not found, email already exists
    services can raise this error and the router will convert it into an HTTP response
    """
    pass
