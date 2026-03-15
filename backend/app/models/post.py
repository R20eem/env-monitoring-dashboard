from datetime import datetime
from sqlalchemy import String, Text, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


# table for blog / feed posts
# both farmers and researchers can create posts
class Post(Base):
    """
    this class represents the posts table.

    each row here is a post that appears in the blog section of the app.
    both farmers and researchers are allowed to create posts.

    we store the title and content of the post, and also the author information.
    since farmers and researchers are stored in different tables, we save both
    the author's id and their role so we know where to look for the user.

    the frontend will mostly use this data when loading the feed with:
    GET /posts
    """
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # because we have 2 user tables, we store both id and role
    author_id: Mapped[int] = mapped_column(Integer, nullable=False)
    author_role: Mapped[str] = mapped_column(String(50), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)