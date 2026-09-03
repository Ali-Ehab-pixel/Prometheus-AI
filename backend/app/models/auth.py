from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


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


class AuthTokenResponse(BaseModel):
    success: bool = True
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
    message: str = "Authentication successful"
