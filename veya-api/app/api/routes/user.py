"""
User profile management routes.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from sqlmodel import Session, select
from uuid import UUID
from datetime import datetime
from datetime import timezone as dt_timezone
from zoneinfo import ZoneInfo
from app.db.database import get_session
from app.models.user import User, UserProfile
from app.models.user_metrics import UserMetrics
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    UserProfileResponse,
    UserProfileCreate,
    UserProfileUpdate,
    UserWithProfileResponse,
    OnboardingStatusResponse,
    UserDisplayInfoResponse,
    GreetingResponse,
    GreetingThemeResponse,
    UserStatsResponse,
)
from app.core.dependencies import get_current_user
from app.db.redis_client import Cache
from app.utils.cache_utils import invalidate_user_info_cache, USER_INFO_CACHE_PREFIX
from app.core.r2_client import upload_file_to_r2, delete_file_from_r2, get_r2_public_url
from app.services.greetings import select_greeting
import json
import mimetypes
from uuid import uuid4

router = APIRouter(prefix="/users", tags=["users"])

# Cache TTL in seconds (30 minutes)
USER_INFO_CACHE_TTL = 1800

# Personalization payload helpers
PERSONALIZATION_LIST_FIELDS = {"goals", "challenges", "practice_preferences", "interests", "reminder_times"}
PERSONALIZATION_METADATA_KEYS = {"onboarding_screen", "timezone"}

MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_AVATAR_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


@router.get("/me/info", response_model=UserDisplayInfoResponse)
def get_my_display_info(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    use_cache: bool = True
):
    """
    Get user information optimized for frontend display (cached).
    
    This endpoint returns a lightweight user info object suitable for displaying
    in the frontend (header, profile sections, etc.). The response is cached in
    Redis for 30 minutes to reduce database load.
    
    Query parameters:
    - use_cache: Set to false to bypass cache (default: true)
    
    Returns:
        UserDisplayInfoResponse with essential user info for frontend display
    """
    cache_key = f"{USER_INFO_CACHE_PREFIX}{current_user.id}"
    
    # Try to get from cache
    if use_cache:
        cached_data = Cache.get(cache_key)
        if cached_data:
            try:
                return UserDisplayInfoResponse(**json.loads(cached_data))
            except Exception as e:
                # If cache data is corrupted, continue to fetch from DB
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to parse cached user info: {e}")
    
    # Fetch from database
    # Get user profile
    statement = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile = session.exec(statement).first()
    
    # Fetch aggregated metrics
    metrics_statement = select(UserMetrics).where(UserMetrics.user_id == current_user.id)
    metrics = session.exec(metrics_statement).first()
    if not metrics:
        metrics = UserMetrics(user_id=current_user.id)
        session.add(metrics)
        session.commit()
        session.refresh(metrics)
    
    # Calculate onboarding status (simplified for display)
    has_profile = profile is not None
    onboarding_completed = profile.personalized_at is not None if profile else False
    current_onboarding_screen = "welcome"
    if profile:
        if profile.onboarding_screen == "sleep":
            current_onboarding_screen = "completed"
        else:
            current_onboarding_screen = profile.onboarding_screen or "welcome"

    timezone_name = "UTC"
    if profile and profile.timezone:
        timezone_name = profile.timezone
    try:
        zone = ZoneInfo(timezone_name)
    except Exception:
        timezone_name = "UTC"
        zone = ZoneInfo(timezone_name)

    local_now = datetime.now(dt_timezone.utc).astimezone(zone)
    greeting_theme = select_greeting(local_now.hour)
    
    # Calculate completion percentage
    completion_percentage = 0
    if profile:
        # Count completed screens (simplified)
        screens_completed = 0
        ONBOARDING_SCREENS = ["welcome", "breathe", "personalize"]
        if profile.onboarding_screen:
            normalized_screen = "completed" if profile.onboarding_screen == "sleep" else profile.onboarding_screen
            if normalized_screen == "completed":
                screens_completed = len(ONBOARDING_SCREENS)
            else:
                try:
                    screens_completed = ONBOARDING_SCREENS.index(normalized_screen) + 1
                except ValueError:
                    screens_completed = 0
        
        # Count required fields
        required_fields = {
            "goals": profile.goals,
            "challenges": profile.challenges,
            "practice_preferences": profile.practice_preferences,
        }
        filled_fields = sum(1 for v in required_fields.values() if v and len(v) > 0)
        fields_completion = (filled_fields / len(required_fields)) * 60 if required_fields else 0
        screens_completion = (screens_completed / len(ONBOARDING_SCREENS)) * 40 if screens_completed > 0 else 0
        completion_percentage = int(screens_completion + fields_completion)
    
    # Build display info
    has_personalization = False
    if profile:
        has_personalization = bool(
            (profile.goals or [])
            or (profile.challenges or [])
            or (profile.practice_preferences or [])
            or (profile.interests or [])
        )
    
    greeting_response = GreetingResponse(
        title=greeting_theme.title,
        subtitle=greeting_theme.subtitle,
        icon=greeting_theme.icon,
        theme=GreetingThemeResponse(
            card=greeting_theme.card_color,
            highlight=greeting_theme.highlight_color,
            accent=greeting_theme.accent_color,
            text_primary=greeting_theme.text_primary,
            text_secondary=greeting_theme.text_secondary,
        ),
    )

    display_info = UserDisplayInfoResponse(
        # Basic user info
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        display_name=current_user.display_name,
        firstname=current_user.firstname,
        lastname=current_user.lastname,
        nickname=current_user.nickname,
        avatar_url=current_user.avatar_url,
        
        # Profile info
        has_profile=has_profile,
        profile_name=profile.name if profile else None,
        
        # Onboarding status
        onboarding_completed=onboarding_completed,
        onboarding_completion_percentage=completion_percentage,
        current_onboarding_screen=current_onboarding_screen,
        
        # Quick stats
        has_personalization=has_personalization,
        has_consent=profile.data_consent if profile else False,
        
        # Profile metrics
        stats=UserStatsResponse(
            day_streak=metrics.day_streak,
            longest_streak=metrics.longest_streak,
            total_checkins=metrics.total_checkins,
            badges_count=metrics.badges_count,
            minutes_practiced=metrics.minutes_practiced,
            last_checkin_at=metrics.last_checkin_at,
        ),
        greeting=greeting_response,
        timezone=timezone_name,
        created_at=current_user.created_at,
        last_login_at=current_user.last_login_at,
    )
    
    # Cache the response
    if use_cache:
        try:
            Cache.set(
                cache_key,
                json.dumps(display_info.model_dump(mode='json'), default=str),
                ttl=USER_INFO_CACHE_TTL
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to cache user info: {e}")
    
    return display_info


@router.get("/me", response_model=UserWithProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current user's full profile including personalization data."""
    # Get user profile
    statement = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile = session.exec(statement).first()
    
    # Get social accounts
    from app.models.user import SocialAccount
    statement = select(SocialAccount).where(SocialAccount.user_id == current_user.id)
    social_accounts = session.exec(statement).all()
    
    from app.schemas.user import SocialAccountResponse
    return UserWithProfileResponse(
        **UserResponse.model_validate(current_user).model_dump(),
        profile=UserProfileResponse.model_validate(profile) if profile else None,
        social_accounts=[SocialAccountResponse.model_validate(acc) for acc in social_accounts]
    )


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update current user's basic information."""
    # Update fields
    if user_update.display_name is not None:
        current_user.display_name = user_update.display_name
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url
    if user_update.username is not None:
        # Check if username is already taken
        if user_update.username != current_user.username:
            statement = select(User).where(User.username == user_update.username)
            existing = session.exec(statement).first()
            if existing and existing.id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        current_user.username = user_update.username
    
    current_user.updated_at = datetime.utcnow()
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    # Invalidate cache
    invalidate_user_info_cache(current_user.id)
    
    return UserResponse.model_validate(current_user)


@router.get("/me/profile", response_model=UserProfileResponse)
def get_my_user_profile(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current user's personalization profile."""
    statement = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile = session.exec(statement).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Complete onboarding to create profile."
        )
    
    return UserProfileResponse.model_validate(profile)


@router.post("/me/profile", response_model=UserProfileResponse)
def create_my_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create or update user's personalization profile."""
    from app.utils.profile_validator import validate_profile_selections
    
    # Flatten payload into personalization updates + metadata
    payload = profile_data.model_dump(exclude_unset=True)
    personalization_updates = dict(payload.pop("personalization_data", {}) or {})
    
    for key in list(payload.keys()):
        if key not in PERSONALIZATION_METADATA_KEYS:
            personalization_updates[key] = payload.pop(key)
    
    # Normalize list values for validation
    for field in PERSONALIZATION_LIST_FIELDS:
        if field in personalization_updates and personalization_updates[field] is not None:
            value = personalization_updates[field]
            if isinstance(value, (tuple, set)):
                personalization_updates[field] = list(value)
            elif not isinstance(value, list):
                personalization_updates[field] = [value]
    
    validation = validate_profile_selections(
        session,
        goals=personalization_updates.get("goals"),
        challenges=personalization_updates.get("challenges"),
        practice_preferences=personalization_updates.get("practice_preferences"),
        interests=personalization_updates.get("interests"),
        reminder_times=personalization_updates.get("reminder_times"),
    )
    
    # Filter out invalid codes using specific validators
    if "goals" in personalization_updates:
        from app.utils.profile_validator import validate_goal_codes
        valid_goals, _ = validate_goal_codes(session, personalization_updates.get("goals") or [])
        personalization_updates["goals"] = valid_goals
    
    if "challenges" in personalization_updates:
        from app.utils.profile_validator import validate_challenge_codes
        valid_challenges, _ = validate_challenge_codes(session, personalization_updates.get("challenges") or [])
        personalization_updates["challenges"] = valid_challenges
    
    if "practice_preferences" in personalization_updates:
        from app.utils.profile_validator import validate_practice_codes
        valid_practices, _ = validate_practice_codes(session, personalization_updates.get("practice_preferences") or [])
        personalization_updates["practice_preferences"] = valid_practices
    
    if "interests" in personalization_updates:
        from app.utils.profile_validator import validate_interest_codes
        valid_interests, _ = validate_interest_codes(session, personalization_updates.get("interests") or [])
        personalization_updates["interests"] = valid_interests
    
    if "reminder_times" in personalization_updates:
        from app.utils.profile_validator import validate_reminder_codes
        valid_reminders, _ = validate_reminder_codes(session, personalization_updates.get("reminder_times") or [])
        personalization_updates["reminder_times"] = valid_reminders
    
    onboarding_screen = payload.pop("onboarding_screen", None)
    if onboarding_screen == "sleep":
        onboarding_screen = "completed"
    timezone_value = payload.pop("timezone", None)
    
    # Check if profile exists
    statement = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile = session.exec(statement).first()
    
    if profile:
        profile.update_personalization(personalization_updates)
        if timezone_value:
            profile.timezone = timezone_value
        
        if onboarding_screen is not None:
            profile.onboarding_screen = onboarding_screen
        
        if not profile.onboarding_started_at:
            profile.onboarding_started_at = datetime.utcnow()
        
        profile.updated_at = datetime.utcnow()
        
        if not profile.personalized_at:
            has_required_fields = (
                profile.goals and len(profile.goals) > 0 and
                profile.challenges and len(profile.challenges) > 0 and
                profile.practice_preferences and len(profile.practice_preferences) > 0
            )
            if has_required_fields and onboarding_screen == "completed":
                profile.personalized_at = datetime.utcnow()
    else:
        profile = UserProfile(
            user_id=current_user.id,
            onboarding_screen=onboarding_screen or "welcome",
            onboarding_started_at=datetime.utcnow(),
        )
        profile.update_personalization(personalization_updates)
        if timezone_value:
            profile.timezone = timezone_value
        
        if onboarding_screen == "completed":
            has_required_fields = (
                profile.goals and len(profile.goals) > 0 and
                profile.challenges and len(profile.challenges) > 0 and
                profile.practice_preferences and len(profile.practice_preferences) > 0
            )
            if has_required_fields:
                profile.personalized_at = datetime.utcnow()
    
    session.add(profile)
    session.commit()
    session.refresh(profile)
    
    # Invalidate cache
    invalidate_user_info_cache(current_user.id)
    
    response = UserProfileResponse.model_validate(profile)
    if validation.get("warnings"):
        # Could add warnings to response if needed
        pass
    
    return response


@router.put("/me/profile", response_model=UserProfileResponse)
def update_my_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update user's personalization profile."""
    from app.utils.profile_validator import (
        validate_goal_codes,
        validate_challenge_codes,
        validate_practice_codes,
        validate_interest_codes,
        validate_reminder_codes,
    )
    
    payload = profile_data.model_dump(exclude_unset=True)
    personalization_updates = dict(payload.pop("personalization_data", {}) or {})
    
    for key in list(payload.keys()):
        if key not in PERSONALIZATION_METADATA_KEYS:
            personalization_updates[key] = payload.pop(key)
    
    for field in PERSONALIZATION_LIST_FIELDS:
        if field in personalization_updates and personalization_updates[field] is not None:
            value = personalization_updates[field]
            if isinstance(value, (tuple, set)):
                personalization_updates[field] = list(value)
            elif not isinstance(value, list):
                personalization_updates[field] = [value]
    
    if "goals" in personalization_updates:
        valid_goals, _ = validate_goal_codes(session, personalization_updates.get("goals") or [])
        personalization_updates["goals"] = valid_goals
    
    if "challenges" in personalization_updates:
        valid_challenges, _ = validate_challenge_codes(session, personalization_updates.get("challenges") or [])
        personalization_updates["challenges"] = valid_challenges
    
    if "practice_preferences" in personalization_updates:
        valid_practices, _ = validate_practice_codes(session, personalization_updates.get("practice_preferences") or [])
        personalization_updates["practice_preferences"] = valid_practices
    
    if "interests" in personalization_updates:
        valid_interests, _ = validate_interest_codes(session, personalization_updates.get("interests") or [])
        personalization_updates["interests"] = valid_interests
    
    if "reminder_times" in personalization_updates:
        valid_reminders, _ = validate_reminder_codes(session, personalization_updates.get("reminder_times") or [])
        personalization_updates["reminder_times"] = valid_reminders
    
    statement = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile = session.exec(statement).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Use POST to create one."
        )
    
    onboarding_screen = payload.pop("onboarding_screen", None)
    if onboarding_screen == "sleep":
        onboarding_screen = "completed"
    timezone_value = payload.pop("timezone", None)
    profile.update_personalization(personalization_updates)
    
    if onboarding_screen is not None:
        profile.onboarding_screen = onboarding_screen
    if timezone_value:
        profile.timezone = timezone_value
    
    if onboarding_screen == "completed" and not profile.personalized_at:
        has_required_fields = (
            profile.goals and len(profile.goals) > 0 and
            profile.challenges and len(profile.challenges) > 0 and
            profile.practice_preferences and len(profile.practice_preferences) > 0
        )
        if has_required_fields:
            profile.personalized_at = datetime.utcnow()
    
    profile.updated_at = datetime.utcnow()
    session.add(profile)
    session.commit()
    session.refresh(profile)
    
    invalidate_user_info_cache(current_user.id)
    
    return UserProfileResponse.model_validate(profile)


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_my_account(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
) -> Response:
    """Delete current user's account (soft delete by deactivating)."""
    current_user.is_active = False
    current_user.updated_at = datetime.utcnow()
    session.add(current_user)
    session.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/me/avatar", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Upload or replace the current user's avatar image."""
    if not file or not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded")

    content_type = file.content_type or mimetypes.guess_type(file.filename)[0]
    if not content_type or content_type not in ALLOWED_AVATAR_CONTENT_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image type")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")
    if len(data) > MAX_AVATAR_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Image too large (max 5MB)")

    extension = ALLOWED_AVATAR_CONTENT_TYPES[content_type]
    r2_key = f"avatars/{current_user.id}/{uuid4()}.{extension}"

    if not upload_file_to_r2(data, r2_key, content_type):
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to store avatar")

    # If previous avatar exists, delete it (best effort)
    if current_user.avatar_r2_key and current_user.avatar_r2_key != r2_key:
        delete_file_from_r2(current_user.avatar_r2_key)

    current_user.avatar_r2_key = r2_key
    current_user.avatar_url = get_r2_public_url(r2_key)
    current_user.avatar_uploaded_at = datetime.utcnow()
    current_user.updated_at = datetime.utcnow()

    session.add(current_user)
    session.commit()
    session.refresh(current_user)

    invalidate_user_info_cache(current_user.id)

    return UserResponse.model_validate(current_user)


@router.get("/me/onboarding/status", response_model=OnboardingStatusResponse)
def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Check if the user has completed onboarding and get current progress.
    
    Returns information about:
    - Whether onboarding is completed
    - Current screen the user should see
    - Completion percentage based on filled fields
    - Which screens have been completed
    - Missing required fields
    
    Onboarding screens flow:
    1. welcome - Welcome screen
    2. breathe - Breathing exercise
    3. personalize - Personalization data collection (final step)
    
    Returns:
        OnboardingStatusResponse with completion status, current screen, and progress details
    """
    # Get user profile
    statement = select(UserProfile).where(UserProfile.user_id == current_user.id)
    profile = session.exec(statement).first()
    
    has_profile = profile is not None
    is_completed = False
    personalized_at = None
    completion_percentage = 0
    missing_fields = []
    current_screen = None
    next_screen = None
    completed_screens = []
    onboarding_started_at = None
    
    # Define onboarding screens in order
    ONBOARDING_SCREENS = ["welcome", "breathe", "personalize"]
    
    if not has_profile:
        # No profile means onboarding not started - start at welcome
        current_screen = "welcome"
        next_screen = "breathe"
        return OnboardingStatusResponse(
            is_completed=False,
            has_profile=False,
            completion_percentage=0,
            missing_fields=["profile"],
            current_screen=current_screen,
            next_screen=next_screen,
            completed_screens=[],
            onboarding_started_at=None
        )
    
    personalized_at = profile.personalized_at
    onboarding_started_at = profile.onboarding_started_at
    stored_screen = profile.onboarding_screen
    if stored_screen == "sleep":
        stored_screen = "completed"
    current_screen = stored_screen
    
    # Determine completed screens based on profile data
    if stored_screen:
        if stored_screen == "completed":
            completed_screens = ONBOARDING_SCREENS[:]
        else:
            try:
                current_index = ONBOARDING_SCREENS.index(stored_screen)
                completed_screens = ONBOARDING_SCREENS[:current_index]
            except ValueError:
                completed_screens = []
    
    # Check if user has progressed through screens
    # Welcome is considered done if profile exists
    if has_profile:
        if "welcome" not in completed_screens:
            completed_screens.append("welcome")
    
    # Breathe is considered done if user has any profile data
    if has_profile and profile.name:
        if "breathe" not in completed_screens:
            completed_screens.append("breathe")
    
    # Personalize is considered done if user has filled some personalization data
    has_personalization_data = (
        profile.goals or 
        profile.challenges or 
        profile.practice_preferences or
        profile.interests or
        profile.age_range or
        profile.gender
    )
    if has_personalization_data:
        if "personalize" not in completed_screens:
            completed_screens.append("personalize")
    
    # Personalize is considered done if personalized_at is set
    if personalized_at:
        if "personalize" not in completed_screens:
            completed_screens.append("personalize")
    
    # Determine current screen if not set
    if not current_screen:
        if personalized_at and len(missing_fields) == 0:
            current_screen = "completed"
        elif has_personalization_data:
            current_screen = "personalize"
        elif has_profile:
            current_screen = "breathe"
        else:
            current_screen = "welcome"
    
    # Determine next screen
    if current_screen in (None, "completed"):
        next_screen = None
    else:
        try:
            current_index = ONBOARDING_SCREENS.index(current_screen)
            if current_index < len(ONBOARDING_SCREENS) - 1:
                next_screen = ONBOARDING_SCREENS[current_index + 1]
            else:
                next_screen = None
        except ValueError:
            next_screen = "personalize"
    
    # Calculate completion based on multiple factors
    # 1. Screens completed (40% weight)
    unique_completed = set(completed_screens)
    screens_completion = (len(unique_completed.intersection(ONBOARDING_SCREENS)) / len(ONBOARDING_SCREENS)) * 40
    
    # 2. Required fields filled (60% weight)
    required_fields = {
        "goals": profile.goals,
        "challenges": profile.challenges,
        "practice_preferences": profile.practice_preferences,
    }
    
    # Check which required fields are missing
    for field_name, field_value in required_fields.items():
        if not field_value or (isinstance(field_value, list) and len(field_value) == 0):
            missing_fields.append(field_name)
    
    fields_completion = 0
    if required_fields:
        completed_field_count = len(required_fields) - len(missing_fields)
        fields_completion = (completed_field_count / len(required_fields)) * 60
    
    completion_percentage = int(screens_completion + fields_completion)
    
    # Additional optional fields completion (bonus up to 100%)
    optional_fields = {
        "interests": profile.interests,
        "reminder_times": profile.reminder_times,
        "age_range": profile.age_range,
        "gender": profile.gender,
        "experience_level": profile.experience_level,
        "mood_tendency": profile.mood_tendency,
    }
    
    optional_completion = 0
    filled_optional = sum(1 for v in optional_fields.values() if v)
    if optional_fields:
        optional_completion = min((filled_optional / len(optional_fields)) * 20, 100 - completion_percentage)
    
    completion_percentage = min(int(completion_percentage + optional_completion), 100)
    
    # Onboarding is complete if:
    # 1. personalized_at is set (user completed the flow)
    # 2. All required fields are filled
    # 3. User has reached personalize screen (final step)
    is_completed = (
        personalized_at is not None and
        len(missing_fields) == 0 and
        "personalize" in completed_screens
    )
    
    # If completed, set current_screen to None (no more onboarding)
    if is_completed:
        current_screen = None
        next_screen = None
        completed_screens = ONBOARDING_SCREENS[:]
    
    ordered_completed_screens = []
    for screen in ONBOARDING_SCREENS:
        if screen in completed_screens and screen not in ordered_completed_screens:
            ordered_completed_screens.append(screen)

    return OnboardingStatusResponse(
        is_completed=is_completed,
        has_profile=True,
        personalized_at=personalized_at,
        completion_percentage=completion_percentage,
        missing_fields=missing_fields,
        current_screen=current_screen,
        next_screen=next_screen,
        completed_screens=ordered_completed_screens,
        onboarding_started_at=onboarding_started_at
    )

