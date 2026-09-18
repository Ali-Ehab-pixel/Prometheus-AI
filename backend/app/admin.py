import logging
import uuid
from datetime import datetime
from typing import Optional

import bleach
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth import get_current_user, get_db, require_admin
from app.models.auth import (
    AdminAnalysesResponse,
    AdminDashboardStats,
    AdminSubscriptionsResponse,
    AdminTicketUpdateRequest,
    AdminUserDetail,
    AdminUserListResponse,
    AdminUserUpdateRequest,
    ContactTicketListResponse,
    ContactTicketResponse,
    UserProfileResponse,
)

logger = logging.getLogger("ai_data_analyst.admin")

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _log_audit(admin_id: str, action: str, target_user_id: Optional[str] = None, details: Optional[str] = None):
    """Log admin actions for audit trail."""
    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO admin_audit_log (id, admin_id, action, target_user_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (str(uuid.uuid4()), admin_id, action, target_user_id, details, datetime.utcnow().isoformat()),
            )
            conn.commit()
    except Exception as e:
        logger.warning(f"Failed to log admin audit: {e}")


@router.get("/dashboard", response_model=AdminDashboardStats)
async def get_dashboard_stats(admin: UserProfileResponse = Depends(require_admin)):
    """Get admin dashboard overview statistics."""
    with get_db() as conn:
        total_users = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
        active_subs = conn.execute(
            "SELECT COUNT(*) as c FROM users WHERE subscription_plan IN ('monthly', 'yearly')"
        ).fetchone()["c"]
        open_tickets = conn.execute(
            "SELECT COUNT(*) as c FROM contact_tickets WHERE status IN ('open', 'in_progress')"
        ).fetchone()["c"]

        today = datetime.utcnow().strftime("%Y-%m-%d")
        analyses_today = conn.execute(
            "SELECT COUNT(*) as c FROM analyses WHERE created_at LIKE ?", (f"{today}%",)
        ).fetchone()["c"]
        total_analyses = conn.execute("SELECT COUNT(*) as c FROM analyses").fetchone()["c"]

        # Revenue from subscriptions
        revenue_result = conn.execute(
            "SELECT COALESCE(SUM(amount_egp), 0) as total FROM subscriptions WHERE status = 'active'"
        ).fetchone()
        monthly_revenue = float(revenue_result["total"])

        # Users by plan
        plan_cursor = conn.execute(
            "SELECT COALESCE(subscription_plan, 'free') as plan, COUNT(*) as c FROM users GROUP BY subscription_plan"
        )
        users_by_plan = {row["plan"]: row["c"] for row in plan_cursor.fetchall()}

    return AdminDashboardStats(
        total_users=total_users,
        active_subscriptions=active_subs,
        open_tickets=open_tickets,
        analyses_today=analyses_today,
        total_analyses=total_analyses,
        monthly_revenue_egp=monthly_revenue,
        users_by_plan=users_by_plan,
    )


@router.get("/users", response_model=AdminUserListResponse)
async def list_users(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: UserProfileResponse = Depends(require_admin),
):
    """List all users with pagination and search."""
    offset = (page - 1) * limit

    with get_db() as conn:
        if search:
            search_term = f"%{bleach.clean(search, tags=[], strip=True)}%"
            cursor = conn.execute(
                "SELECT * FROM users WHERE full_name LIKE ? OR email LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (search_term, search_term, limit, offset),
            )
            total = conn.execute(
                "SELECT COUNT(*) as c FROM users WHERE full_name LIKE ? OR email LIKE ?",
                (search_term, search_term),
            ).fetchone()["c"]
        else:
            cursor = conn.execute(
                "SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset),
            )
            total = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]

        users = []
        for row in cursor.fetchall():
            users.append(
                AdminUserDetail(
                    id=row["id"],
                    full_name=row["full_name"],
                    email=row["email"],
                    phone_number=row["phone_number"],
                    country=row["country"],
                    job_title=row["job_title"],
                    role=row["role"] or "user",
                    created_at=row["created_at"],
                    datasets_uploaded=row["datasets_uploaded"],
                    analyses_performed=row["analyses_performed"],
                    subscription_plan=row["subscription_plan"] or "free",
                    subscription_expires_at=row["subscription_expires_at"],
                    free_uses_remaining=row["free_uses_remaining"] if row["free_uses_remaining"] is not None else 1,
                    is_banned=bool(row["is_banned"]),
                )
            )

    return AdminUserListResponse(users=users, total=total)


@router.get("/users/{user_id}", response_model=AdminUserDetail)
async def get_user_detail(
    user_id: str,
    admin: UserProfileResponse = Depends(require_admin),
):
    """Get detailed info for a specific user."""
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return AdminUserDetail(
        id=row["id"],
        full_name=row["full_name"],
        email=row["email"],
        phone_number=row["phone_number"],
        country=row["country"],
        job_title=row["job_title"],
        role=row["role"] or "user",
        created_at=row["created_at"],
        datasets_uploaded=row["datasets_uploaded"],
        analyses_performed=row["analyses_performed"],
        subscription_plan=row["subscription_plan"] or "free",
        subscription_expires_at=row["subscription_expires_at"],
        free_uses_remaining=row["free_uses_remaining"] if row["free_uses_remaining"] is not None else 1,
        is_banned=bool(row["is_banned"]),
    )


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    req: AdminUserUpdateRequest,
    admin: UserProfileResponse = Depends(require_admin),
):
    """Update user role, subscription, or ban status."""
    updates = []
    params = []

    if req.role is not None:
        if req.role not in ("user", "admin"):
            raise HTTPException(status_code=400, detail="Invalid role. Must be 'user' or 'admin'.")
        updates.append("role = ?")
        params.append(req.role)

    if req.subscription_plan is not None:
        if req.subscription_plan not in ("free", "monthly", "yearly"):
            raise HTTPException(status_code=400, detail="Invalid plan.")
        updates.append("subscription_plan = ?")
        params.append(req.subscription_plan)

    if req.subscription_expires_at is not None:
        updates.append("subscription_expires_at = ?")
        params.append(req.subscription_expires_at)

    if req.free_uses_remaining is not None:
        updates.append("free_uses_remaining = ?")
        params.append(req.free_uses_remaining)

    if req.is_banned is not None:
        updates.append("is_banned = ?")
        params.append(1 if req.is_banned else 0)

    if not updates:
        raise HTTPException(status_code=400, detail="No update fields provided.")

    params.append(user_id)
    with get_db() as conn:
        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    _log_audit(admin.id, "update_user", user_id, str(req.model_dump(exclude_none=True)))

    return {"success": True, "message": f"User {user_id} updated."}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: UserProfileResponse = Depends(require_admin),
):
    """Soft-delete (ban) a user."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")

    with get_db() as conn:
        conn.execute("UPDATE users SET is_banned = 1 WHERE id = ?", (user_id,))
        conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        conn.commit()

    _log_audit(admin.id, "ban_user", user_id)
    return {"success": True, "message": f"User {user_id} has been banned."}


@router.get("/tickets", response_model=ContactTicketListResponse)
async def list_tickets(
    ticket_status: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: UserProfileResponse = Depends(require_admin),
):
    """List all contact/support tickets."""
    offset = (page - 1) * limit

    with get_db() as conn:
        if ticket_status:
            cursor = conn.execute(
                "SELECT * FROM contact_tickets WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (ticket_status, limit, offset),
            )
            total = conn.execute(
                "SELECT COUNT(*) as c FROM contact_tickets WHERE status = ?", (ticket_status,)
            ).fetchone()["c"]
        else:
            cursor = conn.execute(
                "SELECT * FROM contact_tickets ORDER BY created_at DESC LIMIT ? OFFSET ?",
                (limit, offset),
            )
            total = conn.execute("SELECT COUNT(*) as c FROM contact_tickets").fetchone()["c"]

        tickets = []
        for row in cursor.fetchall():
            tickets.append(
                ContactTicketResponse(
                    id=row["id"],
                    user_id=row["user_id"],
                    user_email=row["user_email"],
                    subject=row["subject"],
                    category=row["category"],
                    message=row["message"],
                    status=row["status"],
                    admin_reply=row["admin_reply"],
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )
            )

    return ContactTicketListResponse(tickets=tickets, total=total)


@router.put("/tickets/{ticket_id}")
async def update_ticket(
    ticket_id: str,
    req: AdminTicketUpdateRequest,
    admin: UserProfileResponse = Depends(require_admin),
):
    """Update ticket status or add admin reply."""
    updates = []
    params = []

    if req.status is not None:
        updates.append("status = ?")
        params.append(req.status)

    if req.admin_reply is not None:
        updates.append("admin_reply = ?")
        params.append(bleach.clean(req.admin_reply, tags=[], strip=True))

    updates.append("updated_at = ?")
    params.append(datetime.utcnow().isoformat())
    params.append(ticket_id)

    with get_db() as conn:
        result = conn.execute(f"UPDATE contact_tickets SET {', '.join(updates)} WHERE id = ?", params)
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Ticket not found")
        conn.commit()

    _log_audit(admin.id, "update_ticket", details=f"ticket_id={ticket_id}")
    return {"success": True, "message": "Ticket updated."}


@router.get("/analyses", response_model=AdminAnalysesResponse)
async def list_all_analyses(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin: UserProfileResponse = Depends(require_admin),
):
    """List all analyses across all users."""
    offset = (page - 1) * limit

    with get_db() as conn:
        cursor = conn.execute(
            "SELECT * FROM analyses ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        )
        total = conn.execute("SELECT COUNT(*) as c FROM analyses").fetchone()["c"]

        analyses = []
        for row in cursor.fetchall():
            analyses.append(dict(row))

    return AdminAnalysesResponse(analyses=analyses, total=total)


@router.get("/subscriptions", response_model=AdminSubscriptionsResponse)
async def list_all_subscriptions(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin: UserProfileResponse = Depends(require_admin),
):
    """List all subscriptions with revenue."""
    offset = (page - 1) * limit

    with get_db() as conn:
        cursor = conn.execute(
            "SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        )
        total = conn.execute("SELECT COUNT(*) as c FROM subscriptions").fetchone()["c"]
        revenue = conn.execute(
            "SELECT COALESCE(SUM(amount_egp), 0) as total FROM subscriptions WHERE status = 'active'"
        ).fetchone()["total"]

        subs = []
        for row in cursor.fetchall():
            subs.append(dict(row))

    return AdminSubscriptionsResponse(subscriptions=subs, total=total, total_revenue_egp=float(revenue))
