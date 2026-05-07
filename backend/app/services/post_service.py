"""
File: post_service.py

Purpose:
Handles the business logic for the community blog feature, sitting
between the post router and the post repository layers.

Responsibilities:
- Look up a user's full name by their id and role, since posts and
  comments only store the author id and role rather than the name
- Create new blog posts and pass them to the repository for storage
- Return all posts for the community feed with author name, like
  count, and comment count included, sorted by most liked then newest
- Return a single post with full details by id
- Handle like and unlike logic including checking the post exists
  and preventing the same user from liking a post twice
- Handle comment creation including checking the post exists before
  saving the comment
- Return all comments for a post with author names resolved

Layer:
Backend (Service / Business Logic)

Related:
- post_repository.py (all database queries called by this service)
- farmer_repository.py (get_farmer_by_id used to resolve author names)
- researcher_repository.py (get_researcher_by_id used to resolve
  author names)
- auth_errors.py (AuthError raised when post or user is not found,
  or when a duplicate like is attempted)
- post_
router.py (calls all functions in this service and handles
  the HTTP responses)
- schemas/post.py (shapes the data returned by this service)
- blog.js (frontend that triggers all post, like, and comment actions)
"""

from sqlalchemy.orm import Session
from app.repositories.post_repository import (
    create_post,
    get_post_by_id,
    get_all_posts,
    like_exists,
    create_like,
    delete_like,
    count_likes,
    create_comment,
    get_comments_by_post_id,
    count_comments,
)
from app.repositories.farmer_repository import get_farmer_by_id
from app.repositories.researcher_repository import get_researcher_by_id
from app.services.auth_errors import AuthError


# gets the full name of a user using their id and role
# we need this because posts/comments only store the user id and role
# frontend uses this name when showing who wrote a post or comment
def get_user_name_by_role_and_id(db: Session, user_id: int, role: str) -> str:
    if role == "farmer":
        user = get_farmer_by_id(db, user_id)
    elif role == "researcher":
        user = get_researcher_by_id(db, user_id)
    else:
        user = None

    if not user:
        raise AuthError("User not found")

    return f"{user.first_name} {user.last_name}"

# creates a new post
# router call this after getting the logged in user from token
def create_new_post(db: Session, title: str, content: str, author_id: int, author_role: str):
    return create_post(db, title, content, author_id, author_role)

# returns all posts with extra info needed by the frontend
# frontend can use this for the main feed page
def list_posts_with_details(db: Session):
    posts = get_all_posts(db)
    result = []

    for post in posts:
        author_name = get_user_name_by_role_and_id(db, post.author_id, post.author_role)
        result.append({
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "author_id": post.author_id,
            "author_role": post.author_role,
            "author_name": author_name,
            "likes_count": count_likes(db, post.id),
            "comments_count": count_comments(db, post.id),
            "created_at": post.created_at,
        })

    # sorts the feed so more liked posts show first
    # if likes are the same then newer posts come first
    result.sort(key=lambda x: (x["likes_count"], x["created_at"]), reverse=True)
    return result

# gets one post with all the details frontend needs
# useful for a single post page or when opening one post by id
def get_post_with_details(db: Session, post_id: int):
    post = get_post_by_id(db, post_id)
    if not post:
        raise AuthError("Post not found")

    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "author_id": post.author_id,
        "author_role": post.author_role,
        "author_name": get_user_name_by_role_and_id(db, post.author_id, post.author_role),
        "likes_count": count_likes(db, post.id),
        "comments_count": count_comments(db, post.id),
        "created_at": post.created_at,
    }

# likes a post
# before creating the like we check that:
#  --> the post exists
#  --> the same user has not already liked it
# frontend can uses the returned number to update the like count
def like_post(db: Session, post_id: int, user_id: int, user_role: str):
    post = get_post_by_id(db, post_id)
    if not post:
        raise AuthError("Post not found")

    existing = like_exists(db, post_id, user_id, user_role)
    if existing:
        raise AuthError("You already liked this post")

    create_like(db, post_id, user_id, user_role)
    return count_likes(db, post_id)

# removes a like from a post
def unlike_post(db: Session, post_id: int, user_id: int, user_role: str):
    post = get_post_by_id(db, post_id)
    if not post:
        raise AuthError("Post not found")

    existing = like_exists(db, post_id, user_id, user_role)
    if not existing:
        raise AuthError("You have not liked this post")

    delete_like(db, existing)
    return count_likes(db, post_id)

# adds a comment to a post
# frontend sends the comment text and this saves it under the correct post
def add_comment_to_post(db: Session, post_id: int, author_id: int, author_role: str, content: str):
    post = get_post_by_id(db, post_id)
    if not post:
        raise AuthError("Post not found")

    return create_comment(db, post_id, author_id, author_role, content)

# returns all comments for one post with the author name included
# frontend can use this to load the comments section under a post
def list_comments_with_details(db: Session, post_id: int):
    post = get_post_by_id(db, post_id)
    if not post:
        raise AuthError("Post not found")

    comments = get_comments_by_post_id(db, post_id)
    result = []

    for comment in comments:
        author_name = get_user_name_by_role_and_id(db, comment.author_id, comment.author_role)
        result.append({
            "id": comment.id,
            "post_id": comment.post_id,
            "author_id": comment.author_id,
            "author_role": comment.author_role,
            "author_name": author_name,
            "content": comment.content,
            "created_at": comment.created_at,
        })

    return result