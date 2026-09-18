from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ========== User Auth Models ==========

class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(..., min_length=6, max_length=100)
    phone_number: str = Field(..., min_length=5, max_length=30)
    country: str = Field(..., min_length=2, max_length=60)
    job_title: str = Field(..., min_length=2, max_length=100)


class UserLoginRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str


class OTPVerifyRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    otp_code: str = Field(..., min_length=6, max_length=6)


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone_number: Optional[str] = Field(None, min_length=5, max_length=30)
    country: Optional[str] = Field(None, min_length=2, max_length=60)
    job_title: Optional[str] = Field(None, min_length=2, max_length=100)


class UserProfileResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone_number: str
    country: str
    job_title: str
    created_at: str
    datasets_uploaded: int = 0
    analyses_performed: int = 0
    role: str = "user"
    subscription_plan: str = "free"
    subscription_expires_at: Optional[str] = None
    free_uses_remaining: int = 1


class AuthTokenResponse(BaseModel):
    success: bool = True
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
    message: str = "Authentication successful"
    requires_otp: bool = False


class OTPLoginResponse(BaseModel):
    success: bool = True
    requires_otp: bool = True
    email: str
    message: str = "OTP sent to your email. Please verify to complete login."


# ========== Contact / Support Models ==========

class ContactSubmitRequest(BaseModel):
    subject: str = Field(..., min_length=3, max_length=200)
    category: str = Field(..., pattern=r"^(bug|feature|account|billing|other)$")
    message: str = Field(..., min_length=10, max_length=5000)
    email: Optional[str] = Field(None, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ContactTicketResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_email: str
    subject: str
    category: str
    message: str
    status: str = "open"
    admin_reply: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None


class ContactTicketListResponse(BaseModel):
    tickets: List[ContactTicketResponse] = Field(default_factory=list)
    total: int = 0


# ========== Subscription Models ==========

class SubscriptionPlan(BaseModel):
    id: str
    name: str
    price_egp: float
    billing_cycle: str  # "monthly" or "yearly"
    features: List[str] = Field(default_factory=list)
    savings_percent: Optional[float] = None


class SubscriptionStatusResponse(BaseModel):
    plan: str = "free"
    status: str = "inactive"  # "active", "inactive", "expired", "cancelled"
    expires_at: Optional[str] = None
    free_uses_remaining: int = 1
    is_active: bool = False


class SubscriptionPlansResponse(BaseModel):
    plans: List[SubscriptionPlan] = Field(default_factory=list)


# ========== Admin Models ==========

class AdminDashboardStats(BaseModel):
    total_users: int = 0
    active_subscriptions: int = 0
    open_tickets: int = 0
    analyses_today: int = 0
    total_analyses: int = 0
    monthly_revenue_egp: float = 0.0
    users_by_plan: Dict[str, int] = Field(default_factory=dict)


class AdminUserDetail(BaseModel):
    id: str
    full_name: str
    email: str
    phone_number: str
    country: str
    job_title: str
    role: str
    created_at: str
    datasets_uploaded: int = 0
    analyses_performed: int = 0
    subscription_plan: str = "free"
    subscription_expires_at: Optional[str] = None
    free_uses_remaining: int = 1
    is_banned: bool = False


class AdminUserListResponse(BaseModel):
    users: List[AdminUserDetail] = Field(default_factory=list)
    total: int = 0


class AdminUserUpdateRequest(BaseModel):
    role: Optional[str] = None
    subscription_plan: Optional[str] = None
    subscription_expires_at: Optional[str] = None
    free_uses_remaining: Optional[int] = None
    is_banned: Optional[bool] = None


class AdminTicketUpdateRequest(BaseModel):
    status: Optional[str] = Field(None, pattern=r"^(open|in_progress|resolved|closed)$")
    admin_reply: Optional[str] = Field(None, max_length=5000)


class AdminAnalysesResponse(BaseModel):
    analyses: List[Dict[str, Any]] = Field(default_factory=list)
    total: int = 0


class AdminSubscriptionsResponse(BaseModel):
    subscriptions: List[Dict[str, Any]] = Field(default_factory=list)
    total: int = 0
    total_revenue_egp: float = 0.0
