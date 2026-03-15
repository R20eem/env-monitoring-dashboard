from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_access_token
from app.schemas.post import (
    PostCreateRequest,
    PostResponse,
    CommentCreateRequest,
    CommentResponse,
    LikeResponse,
)
from app.services.post_service import (
    create_new_post,
    list_posts_with_details,
    get_post_with_details,
    like_post,
    unlike_post,
    add_comment_to_post,
    list_comments_with_details,
)
from app.services.auth_errors import AuthError
from app.repositories.farmer_repository import get_farmer_by_email
from app.repositories.researcher_repository import get_researcher_by_email

# all post related endpoints are here
router = APIRouter(prefix="/posts", tags=["posts"])

# this reads the token from the request header
# frontend needs to send:
# Authorization: Bearer <token>
# for the protected endpoints like create post like and comment
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

# small helper to figure out who is currently logged in
# we decode the token then check if the user is a farmer or researcher
# frontend does not call this directly this is just used inside the backend
def get_current_user_from_token(db: Session, token: str):
    try:
        email, role = decode_access_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if role == "farmer":
        user = get_farmer_by_email(db, email)
    elif role == "researcher":
        user = get_researcher_by_email(db, email)
    else:
        user = None

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user, role

# create a new post
# frontend should send title and content in the request body
# user must be logged in because we need to know who created the post
# frontend can use the response to update the feed right after posting
@router.post("/", response_model=PostResponse, status_code=201)
def create_post_endpoint(
    body: PostCreateRequest,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    user, role = get_current_user_from_token(db, token)

    post = create_new_post(db, body.title, body.content, user.id, role)
    full_post = get_post_with_details(db, post.id)
    return PostResponse(**full_post)


# get all posts for the main feed
# frontend can call this when opening the feed page
# each post should already include useful info like author name role likes and comments count
@router.get("/", response_model=list[PostResponse])
def get_all_posts_endpoint(db: Session = Depends(get_db)):
    posts = list_posts_with_details(db)
    return [PostResponse(**post) for post in posts]


# get one specific post
# frontend can use this for a single post page or when opening post details
@router.get("/{post_id}", response_model=PostResponse)
def get_single_post_endpoint(post_id: int, db: Session = Depends(get_db)):
    try:
        post = get_post_with_details(db, post_id)
        return PostResponse(**post)
    except AuthError as e:
        raise HTTPException(status_code=404, detail=str(e))


# like a post
# frontend can call this when the user presses the like button
# this returns the new likes count so the UI can update it right away
@router.post("/{post_id}/like", response_model=LikeResponse)
def like_post_endpoint(
    post_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    user, role = get_current_user_from_token(db, token)

    try:
        likes_count = like_post(db, post_id, user.id, role)
        return LikeResponse(message="Post liked successfully", likes_count=likes_count)
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))

# unlike a post
# frontend can use this if the user clicks the button again or wants to remove their like
# this also returns the updated likes count
@router.delete("/{post_id}/like", response_model=LikeResponse)
def unlike_post_endpoint(
    post_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    user, role = get_current_user_from_token(db, token)

    try:
        likes_count = unlike_post(db, post_id, user.id, role)
        return LikeResponse(message="Like removed successfully", likes_count=likes_count)
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))

# add a comment under a post
# frontend sends the comment text in the body
@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=201)
def create_comment_endpoint(
    post_id: int,
    body: CommentCreateRequest,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
):
    user, role = get_current_user_from_token(db, token)

    try:
        comment = add_comment_to_post(db, post_id, user.id, role, body.content)
        author_name = f"{user.first_name} {user.last_name}"
        return CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            author_id=comment.author_id,
            author_role=comment.author_role,
            author_name=author_name,
            content=comment.content,
            created_at=comment.created_at,
        )
    except AuthError as e:
        raise HTTPException(status_code=400, detail=str(e))


# get all comments for one post
# frontend can call this when opening the comments section under a post
@router.get("/{post_id}/comments", response_model=list[CommentResponse])
def get_comments_endpoint(post_id: int, db: Session = Depends(get_db)):
    try:
        comments = list_comments_with_details(db, post_id)
        return [CommentResponse(**comment) for comment in comments]
    except AuthError as e:
        raise HTTPException(status_code=404, detail=str(e))