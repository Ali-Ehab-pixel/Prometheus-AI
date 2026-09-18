import hashlib
import logging
import os
import random
import secrets
import sqlite3
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional

import bleach
from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.config import settings
from app.models.auth import (
    AuthTokenResponse,
    OTPLoginResponse,
    OTPVerifyRequest,
    UserLoginRequest,
    UserProfileResponse,
    UserRegisterRequest,
    UserUpdateRequest,
)

logger = logging.getLogger("ai_data_analyst.auth")

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "users.db")


def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def sanitize_input(value: str) -> str:
    """Sanitize user input to prevent XSS attacks."""
    if not value:
        return value
    return bleach.clean(value.strip(), tags=[], attributes={}, strip=True)


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
                analyses_performed INTEGER DEFAULT 0,
                role TEXT DEFAULT 'user',
                subscription_plan TEXT DEFAULT 'free',
                subscription_expires_at TEXT,
                subscription_id TEXT,
                free_uses_remaining INTEGER DEFAULT 1,
                is_banned INTEGER DEFAULT 0
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS otp_codes (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                otp_code TEXT NOT NULL,
                purpose TEXT DEFAULT 'login',
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                used INTEGER DEFAULT 0
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS datasets (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                row_count INTEGER,
                col_count INTEGER,
                memory_usage_mb REAL,
                health_score REAL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS dataset_versions (
                id TEXT PRIMARY KEY,
                file_id TEXT NOT NULL,
                version_id TEXT NOT NULL,
                label TEXT NOT NULL,
                row_count INTEGER,
                col_count INTEGER,
                file_path TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                file_id TEXT NOT NULL,
                user_id TEXT,
                action TEXT NOT NULL,
                custom_prompt TEXT,
                target_column TEXT,
                success INTEGER NOT NULL,
                execution_time_seconds REAL,
                artifact_filename TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS contact_tickets (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                user_email TEXT NOT NULL,
                subject TEXT NOT NULL,
                category TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT DEFAULT 'open',
                admin_reply TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS subscriptions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                plan TEXT NOT NULL,
                amount_egp REAL NOT NULL,
                payment_ref TEXT,
                payment_method TEXT,
                status TEXT DEFAULT 'active',
                starts_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS admin_audit_log (
                id TEXT PRIMARY KEY,
                admin_id TEXT NOT NULL,
                action TEXT NOT NULL,
                target_user_id TEXT,
                details TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()

        # Migrate existing users table: add missing columns safely
        _migrate_users_table(conn)

        # Seed admin account
        _seed_admin(conn)


def _migrate_users_table(conn):
    """Add new columns to users table if they don't exist (safe migration)."""
    cursor = conn.execute("PRAGMA table_info(users)")
    existing_columns = {row["name"] for row in cursor.fetchall()}

    migrations = {
        "role": "TEXT DEFAULT 'user'",
        "subscription_plan": "TEXT DEFAULT 'free'",
        "subscription_expires_at": "TEXT",
        "subscription_id": "TEXT",
        "free_uses_remaining": "INTEGER DEFAULT 1",
        "is_banned": "INTEGER DEFAULT 0",
    }

    for col_name, col_def in migrations.items():
        if col_name not in existing_columns:
            try:
                conn.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
                logger.info(f"Added column '{col_name}' to users table")
            except Exception as e:
                logger.warning(f"Could not add column '{col_name}': {e}")

    # Migrate sessions table: add expires_at if missing
    cursor = conn.execute("PRAGMA table_info(sessions)")
    session_columns = {row["name"] for row in cursor.fetchall()}
    if "expires_at" not in session_columns:
        try:
            conn.execute("ALTER TABLE sessions ADD COLUMN expires_at TEXT")
            logger.info("Added column 'expires_at' to sessions table")
        except Exception:
            pass

    conn.commit()


def _seed_admin(conn):
    """Seed the admin account if it doesn't exist."""
    admin_email = settings.ADMIN_EMAIL.lower().strip()
    cursor = conn.execute("SELECT id FROM users WHERE email = ?", (admin_email,))
    if cursor.fetchone():
        # Ensure existing admin has admin role
        conn.execute("UPDATE users SET role = 'admin', free_uses_remaining = 999999 WHERE email = ?", (admin_email,))
        conn.commit()
        return

    admin_id = str(uuid.uuid4())
    pwd_hash, salt = hash_password("Admin1234")
    created_at = datetime.utcnow().strftime("%B %Y")

    conn.execute(
        """
        INSERT INTO users (id, email, password_hash, salt, full_name, phone_number, country, job_title, created_at, role, free_uses_remaining)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', 999999)
        """,
        (
            admin_id,
            admin_email,
            pwd_hash,
            salt,
            "Admin",
            "0000000000",
            "Egypt",
            "Platform Administrator",
            created_at,
        ),
    )
    conn.commit()
    logger.info(f"Admin account seeded: {admin_email}")


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


# Initialize database tables on import (must be after hash_password is defined)
init_db()


def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=settings.SESSION_EXPIRY_HOURS)
    with get_db() as conn:
        # Clean up expired sessions for this user
        conn.execute(
            "DELETE FROM sessions WHERE user_id = ? AND expires_at < ?",
            (user_id, now.isoformat()),
        )
        conn.execute(
            "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, user_id, now.isoformat(), expires_at.isoformat()),
        )
        conn.commit()
    return token


def generate_otp(email: str) -> str:
    """Generate a 6-digit OTP for email verification."""
    otp_code = str(random.randint(100000, 999999))
    otp_id = str(uuid.uuid4())
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=10)

    with get_db() as conn:
        # Invalidate previous unused OTPs for this email
        conn.execute(
            "UPDATE otp_codes SET used = 1 WHERE email = ? AND used = 0",
            (email,),
        )
        conn.execute(
            "INSERT INTO otp_codes (id, email, otp_code, created_at, expires_at) VALUES (?, ?, ?, ?, ?)",
            (otp_id, email.lower().strip(), otp_code, now.isoformat(), expires_at.isoformat()),
        )
        conn.commit()

    # In production, send via email service (SMTP, SendGrid, etc.)
    # For now, log the OTP for development testing
    logger.info(f"[DEV OTP] Email: {email} | OTP: {otp_code} (valid for 10 minutes)")

    return otp_code


def verify_otp(email: str, otp_code: str) -> bool:
    """Verify a 6-digit OTP code."""
    now = datetime.utcnow().isoformat()
    with get_db() as conn:
        cursor = conn.execute(
            """
            SELECT id FROM otp_codes 
            WHERE email = ? AND otp_code = ? AND used = 0 AND expires_at > ?
            ORDER BY created_at DESC LIMIT 1
            """,
            (email.lower().strip(), otp_code, now),
        )
        row = cursor.fetchone()
        if row:
            conn.execute("UPDATE otp_codes SET used = 1 WHERE id = ?", (row["id"],))
            conn.commit()
            return True
    return False


def get_current_user(authorization: Optional[str] = Header(None)) -> UserProfileResponse:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token. Please log in.",
        )
    token = authorization.split(" ")[1]
    now = datetime.utcnow().isoformat()

    with get_db() as conn:
        cursor = conn.execute(
            """
            SELECT u.* FROM users u
            JOIN sessions s ON u.id = s.user_id
            WHERE s.token = ? AND (s.expires_at IS NULL OR s.expires_at > ?)
            """,
            (token, now),
        )
        row = cursor.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
        )

    if row["is_banned"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support.",
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
        role=row["role"] or "user",
        subscription_plan=row["subscription_plan"] or "free",
        subscription_expires_at=row["subscription_expires_at"],
        free_uses_remaining=row["free_uses_remaining"] if row["free_uses_remaining"] is not None else 1,
    )


def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[UserProfileResponse]:
    """Like get_current_user but returns None instead of raising for unauthenticated requests."""
    try:
        return get_current_user(authorization)
    except HTTPException:
        return None


def require_admin(current_user: UserProfileResponse = Depends(get_current_user)) -> UserProfileResponse:
    """Dependency that ensures the current user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required. Access denied.",
        )
    return current_user


def require_subscription(current_user: UserProfileResponse = Depends(get_current_user)) -> UserProfileResponse:
    """Dependency that ensures the current user has an active subscription or free uses remaining."""
    if current_user.role == "admin":
        return current_user  # Admins bypass subscription checks

    # Check active subscription
    if current_user.subscription_plan in ("monthly", "yearly"):
        if current_user.subscription_expires_at:
            try:
                expires = datetime.fromisoformat(current_user.subscription_expires_at)
                if expires > datetime.utcnow():
                    return current_user
            except (ValueError, TypeError):
                pass
        else:
            return current_user  # No expiry set = treat as active

    # Check free uses
    if current_user.free_uses_remaining > 0:
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Subscription required. You have used your free session. Please subscribe to continue.",
    )


def decrement_free_uses(user_id: str):
    """Decrement free uses for a user after they use a feature."""
    with get_db() as conn:
        conn.execute(
            "UPDATE users SET free_uses_remaining = MAX(0, free_uses_remaining - 1) WHERE id = ? AND subscription_plan = 'free'",
            (user_id,),
        )
        conn.commit()


# ==================== Routes ====================

@router.post("/register", response_model=AuthTokenResponse)
async def register_user(req: UserRegisterRequest):
    email_clean = sanitize_input(req.email.lower())
    full_name = sanitize_input(req.full_name)
    phone_number = sanitize_input(req.phone_number)
    country = sanitize_input(req.country)
    job_title = sanitize_input(req.job_title)

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
            INSERT INTO users (id, email, password_hash, salt, full_name, phone_number, country, job_title, created_at, free_uses_remaining)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (
                user_id,
                email_clean,
                pwd_hash,
                salt,
                full_name,
                phone_number,
                country,
                job_title,
                created_at,
            ),
        )
        conn.commit()

    token = create_session(user_id)

    profile = UserProfileResponse(
        id=user_id,
        full_name=full_name,
        email=email_clean,
        phone_number=phone_number,
        country=country,
        job_title=job_title,
        created_at=created_at,
        datasets_uploaded=0,
        analyses_performed=0,
        role="user",
        subscription_plan="free",
        free_uses_remaining=1,
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
    email_clean = sanitize_input(req.email.lower())

    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email_clean,))
        row = cursor.fetchone()

    if not row or not verify_password(req.password, row["password_hash"], row["salt"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    if row["is_banned"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support.",
        )

    user_id = row["id"]
    token = create_session(user_id)

    profile = UserProfileResponse(
        id=user_id,
        full_name=row["full_name"],
        email=row["email"],
        phone_number=row["phone_number"],
        country=row["country"],
        job_title=row["job_title"],
        created_at=row["created_at"],
        datasets_uploaded=row["datasets_uploaded"],
        analyses_performed=row["analyses_performed"],
        role=row["role"] or "user",
        subscription_plan=row["subscription_plan"] or "free",
        subscription_expires_at=row["subscription_expires_at"],
        free_uses_remaining=row["free_uses_remaining"] if row["free_uses_remaining"] is not None else 1,
    )

    return AuthTokenResponse(
        success=True,
        access_token=token,
        token_type="bearer",
        user=profile,
        message="Logged in successfully",
    )



@router.post("/verify-otp", response_model=AuthTokenResponse)
async def verify_otp_login(req: OTPVerifyRequest):
    """Verify OTP and complete login."""
    email_clean = sanitize_input(req.email.lower())

    if not verify_otp(email_clean, req.otp_code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP code. Please request a new one.",
        )

    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email_clean,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found.",
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
        role=row["role"] or "user",
        subscription_plan=row["subscription_plan"] or "free",
        subscription_expires_at=row["subscription_expires_at"],
        free_uses_remaining=row["free_uses_remaining"] if row["free_uses_remaining"] is not None else 1,
    )

    return AuthTokenResponse(
        success=True,
        access_token=token,
        token_type="bearer",
        user=profile,
        message="Logged in successfully",
    )


@router.post("/resend-otp")
async def resend_otp(req: UserLoginRequest):
    """Resend OTP — requires re-authentication with password."""
    email_clean = sanitize_input(req.email.lower())

    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM users WHERE email = ?", (email_clean,))
        row = cursor.fetchone()

    if not row or not verify_password(req.password, row["password_hash"], row["salt"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    generate_otp(email_clean)
    return {"success": True, "message": "New OTP sent to your email."}


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
        params.append(sanitize_input(req.full_name))
    if req.phone_number is not None:
        updates.append("phone_number = ?")
        params.append(sanitize_input(req.phone_number))
    if req.country is not None:
        updates.append("country = ?")
        params.append(sanitize_input(req.country))
    if req.job_title is not None:
        updates.append("job_title = ?")
        params.append(sanitize_input(req.job_title))

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
                role=row["role"] or "user",
                subscription_plan=row["subscription_plan"] or "free",
                subscription_expires_at=row["subscription_expires_at"],
                free_uses_remaining=row["free_uses_remaining"] if row["free_uses_remaining"] is not None else 1,
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
