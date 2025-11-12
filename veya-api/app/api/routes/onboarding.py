"""
Onboarding progress tracking routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.db.database import get_session
from app.models.user import User, UserProfile
from app.schemas.user import OnboardingStatusResponse
from app.core.dependencies import get_current_user
from app.utils.cache_utils import invalidate_user_info_cache

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


class UpdateOnboardingScreenRequest(BaseModel):
    """Request to update current onboarding screen"""
    screen: str  # "welcome", "breathe", "personalize", "completed"


@router.get("/status", response_model=OnboardingStatusResponse)
def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get onboarding status - alias for /api/users/me/onboarding/status.
    Check if the user has completed onboarding and get current progress.
    
    This endpoint is the same as GET /api/users/me/onboarding/status.
    Use this endpoint for convenience if you prefer /api/onboarding/status.
    """
    # Import here to avoid circular imports
    from app.api.routes.user import get_onboarding_status
    return get_onboarding_status(current_user, session)


@router.post("/screen")
def update_onboarding_screen(
    request: UpdateOnboardingScreenRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update the current onboarding screen the user is on.
    This allows users to save their progress and continue from where they left off.
    
    Valid screens: "welcome", "breathe", "personalize", "completed"
    """
    valid_screens = ["welcome", "breathe", "personalize", "completed"]
    
    if request.screen not in valid_screens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid screen. Must be one of: {', '.join(valid_screens)}"
        )
    
    # Get or create user profile
    statement = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile = session.exec(statement).first()
    
    if not profile:
        # Create profile with current screen
        profile = UserProfile(
            user_id=current_user.id,
            onboarding_screen=request.screen,
            onboarding_started_at=datetime.utcnow(),
        )
        session.add(profile)
    else:
        # Update current screen
        profile.onboarding_screen = request.screen
        
        # Set onboarding_started_at if not set
        if not profile.onboarding_started_at:
            profile.onboarding_started_at = datetime.utcnow()
        
        profile.updated_at = datetime.utcnow()
        session.add(profile)
    
    session.commit()
    session.refresh(profile)
    
    # Invalidate user info cache
    invalidate_user_info_cache(current_user.id)
    
    return {
        "message": "Onboarding screen updated",
        "current_screen": profile.onboarding_screen,
        "onboarding_started_at": profile.onboarding_started_at
    }

