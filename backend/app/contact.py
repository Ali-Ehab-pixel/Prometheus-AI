import logging
import uuid
from datetime import datetime
from typing import Optional

import bleach
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user, get_db, get_optional_user
from app.models.auth import (
    ContactSubmitRequest,
    ContactTicketListResponse,
    ContactTicketResponse,
    UserProfileResponse,
)

logger = logging.getLogger("ai_data_analyst.contact")

router = APIRouter(prefix="/api/contact", tags=["Contact & Support"])


@router.post("/submit", response_model=ContactTicketResponse)
async def submit_ticket(
    req: ContactSubmitRequest,
    current_user: Optional[UserProfileResponse] = Depends(get_optional_user),
):
    """Submit a new support/contact ticket. Works for both authenticated and guest users."""
    # Determine email: from auth or from request body
    if current_user:
        user_email = current_user.email
        user_id = current_user.id
    elif req.email:
        user_email = req.email.lower().strip()
        user_id = None
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required for guest ticket submissions.",
        )

    # Sanitize inputs
    subject = bleach.clean(req.subject.strip(), tags=[], strip=True)
    message = bleach.clean(req.message.strip(), tags=[], strip=True)
    category = req.category

    ticket_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO contact_tickets (id, user_id, user_email, subject, category, message, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'open', ?)
            """,
            (ticket_id, user_id, user_email, subject, category, message, now),
        )
        conn.commit()

    logger.info(f"New support ticket submitted: {ticket_id} from {user_email}")

    return ContactTicketResponse(
        id=ticket_id,
        user_id=user_id,
        user_email=user_email,
        subject=subject,
        category=category,
        message=message,
        status="open",
        created_at=now,
    )


@router.get("/my-tickets", response_model=ContactTicketListResponse)
async def get_my_tickets(
    current_user: UserProfileResponse = Depends(get_current_user),
):
    """List the current user's own support tickets."""
    with get_db() as conn:
        cursor = conn.execute(
            "SELECT * FROM contact_tickets WHERE user_id = ? ORDER BY created_at DESC",
            (current_user.id,),
        )
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

    return ContactTicketListResponse(tickets=tickets, total=len(tickets))


@router.get("/tickets/{ticket_id}", response_model=ContactTicketResponse)
async def get_ticket_detail(
    ticket_id: str,
    current_user: UserProfileResponse = Depends(get_current_user),
):
    """Get a specific ticket detail. User can only see their own tickets (admins can see all)."""
    with get_db() as conn:
        cursor = conn.execute("SELECT * FROM contact_tickets WHERE id = ?", (ticket_id,))
        row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Check ownership or admin
    if row["user_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You can only view your own tickets.")

    return ContactTicketResponse(
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
