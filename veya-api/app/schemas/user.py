from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from app.models.user import AuthProvider


# ==================== User Schemas ====================

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    nickname: Optional[str] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = None  # For email/password registration
    firebase_uid: Optional[str] = None  # For Firebase auth
    auth_provider: AuthProvider = AuthProvider.GUEST


class UserUpdate(UserBase):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: UUID
    email: Optional[str] = None
    email_verified: bool
    username: Optional[str] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    nickname: Optional[str] = None
    is_guest: bool
    auth_provider: AuthProvider
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ==================== Firebase Auth Schemas ====================

class FirebaseAuthRequest(BaseModel):
    """Request to authenticate with Firebase ID token"""
    id_token: str  # Firebase ID token
    provider: Optional[AuthProvider] = AuthProvider.FIREBASE


class FirebaseAuthResponse(BaseModel):
    """Response after Firebase authentication"""
    user: UserResponse
    token: str  # JWT token
    is_new_user: bool  # True if user was just created


# ==================== Social Account Schemas ====================

class SocialAccountCreate(BaseModel):
    provider: AuthProvider
    provider_account_id: str
    provider_email: Optional[str] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None


class SocialAccountResponse(BaseModel):
    id: UUID
    provider: AuthProvider
    provider_account_id: str
    provider_email: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== User Profile Schemas ====================

class UserProfileBase(BaseModel):
    personalization_data: Optional[Dict[str, Any]] = None
    
    # Basic Info
    name: Optional[str] = None
    age_range: Optional[str] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    timezone: Optional[str] = None
    
    # Lifestyle
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    work_hours: Optional[str] = None
    screen_time: Optional[str] = None
    
    # Preferences (as lists)
    goals: List[str] = Field(default_factory=list)
    challenges: List[str] = Field(default_factory=list)
    practice_preferences: List[str] = Field(default_factory=list)
    reminder_times: List[str] = Field(default_factory=list)
    interests: List[str] = Field(default_factory=list)
    
    # Experience
    experience_level: Optional[str] = None
    mood_tendency: Optional[str] = None
    preferred_practice_time: Optional[str] = None
    
    # Consent
    data_consent: bool = False
    marketing_consent: bool = False


class UserProfileCreate(UserProfileBase):
    user_id: UUID


class UserProfileUpdate(UserProfileBase):
    onboarding_screen: Optional[str] = None  # Update current onboarding screen


class UserProfileResponse(UserProfileBase):
    personalization_data: Dict[str, Any] = Field(default_factory=dict)
    id: UUID
    user_id: UUID
    onboarding_screen: Optional[str] = None
    onboarding_started_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    personalized_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ==================== Combined User with Profile ====================

class UserWithProfileResponse(UserResponse):
    """User response including profile information"""
    profile: Optional[UserProfileResponse] = None
    social_accounts: List[SocialAccountResponse] = Field(default_factory=list)


# ==================== Authentication Schemas ====================

class LoginRequest(BaseModel):
    """Email and password login request"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response with user and token"""
    user: UserResponse
    token: str
    token_type: str = "bearer"


class TokenResponse(BaseModel):
    """JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GuestAuthResponse(BaseModel):
    """Guest authentication response"""
    user_id: UUID
    token: str
    user: UserResponse


# ==================== Onboarding Schemas ====================

class OnboardingStatusResponse(BaseModel):
    """Onboarding status response"""
    is_completed: bool
    has_profile: bool
    personalized_at: Optional[datetime] = None
    completion_percentage: int = 0  # 0-100
    missing_fields: List[str] = []  # List of missing required fields
    current_screen: Optional[str] = None  # Current onboarding screen: "welcome", "breathe", "personalize", "completed"
    next_screen: Optional[str] = None  # Next screen to show
    completed_screens: List[str] = []  # List of completed screens
    onboarding_started_at: Optional[datetime] = None  # When user started onboarding
    
    class Config:
        from_attributes = True


# ==================== User Display Info (Frontend-friendly) ====================

class GreetingThemeResponse(BaseModel):
    card: str
    highlight: str
    accent: str
    text_primary: str
    text_secondary: str


class GreetingResponse(BaseModel):
    title: str
    subtitle: str
    icon: str
    theme: GreetingThemeResponse


class UserStatsResponse(BaseModel):
    """Aggregated statistics for profile overview."""

    day_streak: int = 0
    longest_streak: int = 0
    total_checkins: int = 0
    badges_count: int = 0
    minutes_practiced: int = 0
    last_checkin_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserDisplayInfoResponse(BaseModel):
    """User information optimized for frontend display (cached)"""
    # Basic user info
    id: UUID
    email: Optional[str] = None
    username: Optional[str] = None
    display_name: Optional[str] = None
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    nickname: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # Profile info
    has_profile: bool = False
    profile_name: Optional[str] = None
    timezone: str = "UTC"
    
    # Onboarding status (simplified)
    onboarding_completed: bool = False
    onboarding_completion_percentage: int = 0
    current_onboarding_screen: Optional[str] = None
    
    # Quick stats (for display)
    has_personalization: bool = False  # Has goals/challenges/preferences
    has_consent: bool = False  # Has given data consent
    
    # Profile metrics
    stats: UserStatsResponse = Field(default_factory=UserStatsResponse)
    greeting: Optional[GreetingResponse] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
