import hashlib
import os
import secrets
import sqlite3
import uuid
from datetime import datetime
from typing import Dict, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.models.auth import (
    AuthTokenResponse,
    UserLoginRequest,
    UserProfileResponse,
    UserRegisterRequest,
    UserUpdateRequest,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "users.db")


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                full_name TEXT NOT NULL,
                phone_number TEXT NOT NULL,
                country TEXT NOT NULL,
                job_title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                datasets_uploaded INTEGER DEFAULT 0,
                analyses_performed INTEGER DEFAULT 0
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )
        conn.commit()


# Initialize database tables on import
init_db()


def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000
    ).hex()
    return pwd_hash, salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    new_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(new_hash, password_hash)


def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    with get_db() as conn:
        conn.execute(
            "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
            (token, user_id, datetime.utcnow().isoformat()),
        )
        conn.commit()
    return token


def get_current_user(authorization: Optional[str] = Header(None)) -> UserProfileResponse:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token. Please log in.",
        )
    token = authorization.split(" ")[1]

    with get_db() as conn:
        cursor = conn.execute(
            """
            SELECT u.* FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.token = ?
            """,
            (token,),
        )
        row = cursor.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
        )

    return UserProfileResponse(
        id=row["id"],
        full_name=row["full_name"],
        email=row["email"],
        phone_number=row["phone_number"],
        country=row["country"],
        job_title=row["job_title"],
        created_at=row["created_at"],
        datasets_uploaded=row["datasets_uploaded"],
        analyses_performed=row["analyses_performed"],
    )


@router.post("/register", response_model=AuthTokenResponse)
async def register_user(req: UserRegisterRequest):
    email_clean = req.email.lower().strip()

    with get_db() as conn:
        cursor = conn.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists. Please log in.",
            )

        user_id = str(uuid.uuid4())
        pwd_hash, salt = hash_password(req.password)
        created_at = datetime.utcnow().strftime("%B %Y")

        conn.execute(
            """
            INSERT INTO users (id, email, password_hash, salt, full_name, phone_number, country, job_title, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                email_clean,
                pwd_hash,
                salt,
                req.full_name.strip(),
                req.phone_number.strip(),
                req.country.strip(),
                req.job_title.strip(),
                created_at,
            ),
        )
        conn.commit()

    token = create_session(user_id)

    profile = UserProfileResponse(
        id=user_id,
        full_name=req.full_name.strip(),
        email=email_clean,
        phone_number=req.phone_number.strip(),
        country=req.country.strip(),
        job_title=req.job_title.strip(),
        created_at=created_at,
        datasets_uploaded=0,
        analyses_performed=0,
    )

    return AuthTokenResponse(
        success=True,
        access_token=token,
        token_type="bearer",
        user=profile,
        message="Account registered successfully",
    )


@router.post("/login", response_model=AuthTokenResponse)
async def login_user(req: UserLoginRequest):
    email_clean = req.email.lower().strip()

    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email_clean,))
        row = cursor.fetchone()

    if not row or not verify_password(req.password, row["password_hash"], row["salt"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    token = create_session(row["id"])

    profile = UserProfileResponse(
        id=row["id"],
        full_name=row["full_name"],
        email=row["email"],
        phone_number=row["phone_number"],
        country=row["country"],
        job_title=row["job_title"],
        created_at=row["created_at"],
        datasets_uploaded=row["datasets_uploaded"],
        analyses_performed=row["analyses_performed"],
    )

    return AuthTokenResponse(
        success=True,
        access_token=token,
        token_type="bearer",
        user=profile,
        message="Logged in successfully",
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: UserProfileResponse = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserProfileResponse)
async def update_my_profile(
    req: UserUpdateRequest,
    current_user: UserProfileResponse = Depends(get_current_user),
):
    updates = []
    params = []

    if req.full_name is not None:
        updates.append("full_name = ?")
        params.append(req.full_name.strip())
    if req.phone_number is not None:
        updates.append("phone_number = ?")
        params.append(req.phone_number.strip())
    if req.country is not None:
        updates.append("country = ?")
        params.append(req.country.strip())
    if req.job_title is not None:
        updates.append("job_title = ?")
        params.append(req.job_title.strip())

    if updates:
        params.append(current_user.id)
        with get_db() as conn:
            conn.execute(
                f"UPDATE users SET {', '.join(updates)} WHERE id = ?",
                params,
            )
            conn.commit()

            cursor = conn.execute("SELECT * FROM users WHERE id = ?", (current_user.id,))
            row = cursor.fetchone()

            return UserProfileResponse(
                id=row["id"],
                full_name=row["full_name"],
                email=row["email"],
                phone_number=row["phone_number"],
                country=row["country"],
                job_title=row["job_title"],
                created_at=row["created_at"],
                datasets_uploaded=row["datasets_uploaded"],
                analyses_performed=row["analyses_performed"],
            )

    return current_user


@router.post("/logout")
async def logout_user(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        with get_db() as conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.commit()
    return {"success": True, "message": "Logged out successfully"}
