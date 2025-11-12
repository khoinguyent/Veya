"""
Utility functions to validate user profile data against templates.
"""
from sqlmodel import Session, select
from typing import List, Optional
from app.models.personalization_templates import PersonalizationTemplate
from app.utils.personalization_defaults import get_default_templates


def get_template_codes_for_category(session: Session, category: str) -> set:
    """
    Get all active template codes for a category.
    
    Returns:
        Set of active template codes
    """
    statement = select(PersonalizationTemplate).where(
        PersonalizationTemplate.category == category
    )
    template_record = session.exec(statement).first()
    
    if template_record:
        # Get active template codes from database
        active_templates = [
            t for t in template_record.templates 
            if t.get("is_active", True)
        ]
        return {t["code"] for t in active_templates}
    else:
        # Fall back to defaults
        defaults = get_default_templates()
        templates = defaults.get(category, [])
        return {t["code"] for t in templates if t.get("is_active", True)}


def validate_template_codes(
    session: Session,
    category: str,
    codes: List[str]
) -> tuple[List[str], List[str]]:
    """
    Validate template codes against database.
    
    Returns:
        Tuple of (valid_codes, invalid_codes)
    """
    if not codes:
        return [], []
    
    valid_codes_set = get_template_codes_for_category(session, category)
    valid_codes = [code for code in codes if code in valid_codes_set]
    invalid_codes = [code for code in codes if code not in valid_codes_set]
    
    return valid_codes, invalid_codes


def validate_goal_codes(session: Session, codes: List[str]) -> tuple[List[str], List[str]]:
    """Validate goal template codes."""
    return validate_template_codes(session, "goals", codes)


def validate_challenge_codes(session: Session, codes: List[str]) -> tuple[List[str], List[str]]:
    """Validate challenge template codes."""
    return validate_template_codes(session, "challenges", codes)


def validate_practice_codes(session: Session, codes: List[str]) -> tuple[List[str], List[str]]:
    """Validate practice preference template codes."""
    return validate_template_codes(session, "practices", codes)


def validate_interest_codes(session: Session, codes: List[str]) -> tuple[List[str], List[str]]:
    """Validate interest template codes."""
    return validate_template_codes(session, "interests", codes)


def validate_reminder_codes(session: Session, codes: List[str]) -> tuple[List[str], List[str]]:
    """Validate reminder template codes."""
    return validate_template_codes(session, "reminders", codes)


def validate_profile_selections(
    session: Session,
    goals: Optional[List[str]] = None,
    challenges: Optional[List[str]] = None,
    practice_preferences: Optional[List[str]] = None,
    interests: Optional[List[str]] = None,
    reminder_times: Optional[List[str]] = None,
) -> dict:
    """
    Validate all profile selections against templates.
    
    Returns:
        Dictionary with validation results:
        {
            "valid": True/False,
            "errors": {...},
            "warnings": {...}
        }
    """
    errors = {}
    warnings = {}
    
    # Validate goals
    if goals:
        valid, invalid = validate_goal_codes(session, goals)
        if invalid:
            errors["goals"] = f"Invalid goal codes: {', '.join(invalid)}"
        if len(valid) < len(goals):
            warnings["goals"] = f"Some goals were filtered out: {invalid}"
    
    # Validate challenges
    if challenges:
        valid, invalid = validate_challenge_codes(session, challenges)
        if invalid:
            errors["challenges"] = f"Invalid challenge codes: {', '.join(invalid)}"
        if len(valid) < len(challenges):
            warnings["challenges"] = f"Some challenges were filtered out: {invalid}"
    
    # Validate practice preferences
    if practice_preferences:
        valid, invalid = validate_practice_codes(session, practice_preferences)
        if invalid:
            errors["practice_preferences"] = f"Invalid practice codes: {', '.join(invalid)}"
        if len(valid) < len(practice_preferences):
            warnings["practice_preferences"] = f"Some practices were filtered out: {invalid}"
    
    # Validate interests
    if interests:
        valid, invalid = validate_interest_codes(session, interests)
        if invalid:
            errors["interests"] = f"Invalid interest codes: {', '.join(invalid)}"
        if len(valid) < len(interests):
            warnings["interests"] = f"Some interests were filtered out: {invalid}"
    
    # Validate reminder times
    if reminder_times:
        valid, invalid = validate_reminder_codes(session, reminder_times)
        if invalid:
            errors["reminder_times"] = f"Invalid reminder codes: {', '.join(invalid)}"
        if len(valid) < len(reminder_times):
            warnings["reminder_times"] = f"Some reminders were filtered out: {invalid}"
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }
