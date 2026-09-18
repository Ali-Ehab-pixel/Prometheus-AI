import logging
import time
from typing import Callable

import bleach
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import settings

logger = logging.getLogger("ai_data_analyst.middleware")

# ==================== Rate Limiter ====================

limiter = Limiter(key_func=get_remote_address)


def setup_rate_limiter(app: FastAPI):
    """Attach the rate limiter to the FastAPI app."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ==================== Security Headers Middleware ====================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adds security headers to every response."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Prevent MIME-type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # XSS Protection (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions Policy
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        # HSTS (only in production)
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; "
            "font-src 'self' data:; "
            "connect-src 'self' http://localhost:* http://127.0.0.1:* https://*; "
            "frame-src 'self'"
        )

        return response


# ==================== Request Logging Middleware ====================

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs all API requests with timing for admin monitoring."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        response = await call_next(request)

        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000

        # Log the request (skip health checks to reduce noise)
        if not request.url.path.endswith("/health"):
            logger.info(
                f"[{request.method}] {request.url.path} | "
                f"IP: {client_ip} | "
                f"Status: {response.status_code} | "
                f"Duration: {duration_ms:.1f}ms"
            )

        return response


# ==================== Input Sanitization ====================

def sanitize_string(value: str) -> str:
    """Sanitize a string input — strip HTML tags and escape dangerous characters."""
    if not value:
        return value
    return bleach.clean(value.strip(), tags=[], attributes={}, strip=True)


def sanitize_dict(data: dict) -> dict:
    """Recursively sanitize all string values in a dictionary."""
    sanitized = {}
    for key, value in data.items():
        if isinstance(value, str):
            sanitized[key] = sanitize_string(value)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_string(item) if isinstance(item, str)
                else sanitize_dict(item) if isinstance(item, dict)
                else item
                for item in value
            ]
        else:
            sanitized[key] = value
    return sanitized
