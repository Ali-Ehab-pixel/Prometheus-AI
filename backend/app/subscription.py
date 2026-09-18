import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from app.auth import get_current_user, get_db
from app.models.auth import (
    SubscriptionPlan,
    SubscriptionPlansResponse,
    SubscriptionStatusResponse,
    UserProfileResponse,
)

logger = logging.getLogger("ai_data_analyst.subscription")

router = APIRouter(prefix="/api/subscription", tags=["Subscription"])

# ==================== Subscription Plans ====================

SUBSCRIPTION_PLANS = [
    SubscriptionPlan(
        id="monthly",
        name="Monthly Plan",
        price_egp=60.0,
        billing_cycle="monthly",
        features=[
            "Unlimited data uploads",
            "Unlimited AI analysis actions",
            "Advanced visualizations & charts",
            "AutoML model training & benchmarking",
            "AI Copilot assistant",
            "Executive report generation",
            "What-If prediction simulator",
            "Experiment history & versioning",
            "Priority support",
        ],
    ),
    SubscriptionPlan(
        id="yearly",
        name="Yearly Plan",
        price_egp=700.0,
        billing_cycle="yearly",
        features=[
            "Everything in Monthly Plan",
            "Unlimited data uploads",
            "Unlimited AI analysis actions",
            "Advanced visualizations & charts",
            "AutoML model training & benchmarking",
            "AI Copilot assistant",
            "Executive report generation",
            "What-If prediction simulator",
            "Experiment history & versioning",
            "Priority support",
        ],
        savings_percent=2.8,  # Save ~2.8% vs monthly (60*12=720 vs 700)
    ),
]


@router.get("/plans", response_model=SubscriptionPlansResponse)
async def get_plans():
    """Get available subscription plans."""
    return SubscriptionPlansResponse(plans=SUBSCRIPTION_PLANS)


@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
    current_user: UserProfileResponse = Depends(get_current_user),
):
    """Get current user's subscription status."""
    plan = current_user.subscription_plan or "free"
    is_active = False
    status_str = "inactive"

    if plan in ("monthly", "yearly"):
        if current_user.subscription_expires_at:
            try:
                expires = datetime.fromisoformat(current_user.subscription_expires_at)
                if expires > datetime.utcnow():
                    is_active = True
                    status_str = "active"
                else:
                    status_str = "expired"
            except (ValueError, TypeError):
                status_str = "active"
                is_active = True
        else:
            is_active = True
            status_str = "active"

    # Admin always active
    if current_user.role == "admin":
        is_active = True
        status_str = "active"

    return SubscriptionStatusResponse(
        plan=plan,
        status=status_str,
        expires_at=current_user.subscription_expires_at,
        free_uses_remaining=current_user.free_uses_remaining,
        is_active=is_active,
    )


@router.post("/cancel")
async def cancel_subscription(
    current_user: UserProfileResponse = Depends(get_current_user),
):
    """Cancel current subscription (reverts to free plan)."""
    with get_db() as conn:
        conn.execute(
            "UPDATE users SET subscription_plan = 'free', subscription_expires_at = NULL WHERE id = ?",
            (current_user.id,),
        )
        conn.execute(
            "UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'",
            (current_user.id,),
        )
        conn.commit()

    return {"success": True, "message": "Subscription cancelled. You are now on the free plan."}
