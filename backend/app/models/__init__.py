# Importing the model ensures it is loaded into sqlalchemy metadata.
# so without it base.metadata.create_all() will not create the users table.
from .farmer import Farmer  # noqa: F401
from .researcher import Researcher  # noqa: F401