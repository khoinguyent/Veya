"""
Template management routes for personalization options.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import datetime
from app.db.database import get_session
from app.models.personalization_templates import PersonalizationTemplate
from app.schemas.template import PersonalizationTemplateViewResponse, TemplateItemResponse, FieldDefinitionResponse
from app.utils.personalization_defaults import (
    DEFAULT_AGE_RANGES,
    DEFAULT_GENDERS,
    DEFAULT_WORK_HOURS,
    DEFAULT_SCREEN_TIME,
)
from app.utils.template_seeder import get_active_templates_for_category

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("/all")
def get_all_templates(session: Session = Depends(get_session)):
    """
    Get all available templates and static options in one request.
    
    Templates come from the database (personalization_templates table).
    Static options (age_ranges, genders, etc.) come from defaults as they're enum values.
    
    Note: Database should be seeded via init.sql or seed_templates() before using this endpoint.
    """
    from app.utils.personalization_defaults import DEFAULT_AGE_RANGES, DEFAULT_GENDERS, DEFAULT_WORK_HOURS, DEFAULT_SCREEN_TIME
    
    # Get active templates from database for each category
    categories = ["goals", "challenges", "practices", "interests", "reminders"]
    templates_dict = {}
    
    for category in categories:
        templates = get_active_templates_for_category(session, category)
        # Format for API response (just code, label, emoji)
        templates_dict[category] = [
            {
                "code": t["code"],
                "label": t["label"],
                "emoji": t.get("emoji"),
                "description": t.get("description"),
            }
            for t in templates
        ]
    
    # Also get templates from database for other categories that might be needed
    db_categories = ["practice_preferences", "experience_levels", "mood_tendencies", "practice_times"]
    for category in db_categories:
        templates = get_active_templates_for_category(session, category)
        if templates:  # Only add if found in database
            templates_dict[category] = [
                {
                    "code": t["code"],
                    "label": t["label"],
                    "emoji": t.get("emoji"),
                    "description": t.get("description"),
                }
                for t in templates
            ]
    
    # Static options (enum values, not stored in database)
    # These come from defaults as they're hardcoded enum values
    return {
        **templates_dict,
        # Static enum options (not templates, just valid values)
        "age_ranges": DEFAULT_AGE_RANGES,
        "genders": DEFAULT_GENDERS,
        "work_hours": DEFAULT_WORK_HOURS,
        "screen_time": DEFAULT_SCREEN_TIME,
        # Note: experience_levels, mood_tendencies, practice_times should come from database if available
        # Fallback to defaults only if not in database
        "experience_levels": templates_dict.get("experience_levels", ["beginner", "intermediate", "advanced"]),
        "mood_tendencies": templates_dict.get("mood_tendencies", ["calm", "stressed", "sad", "happy"]),
        "practice_times": templates_dict.get("practice_times", ["morning", "afternoon", "night"]),
    }


@router.get("/goals")
def get_goal_templates(session: Session = Depends(get_session)):
    """Get all active goal templates."""
    templates = get_active_templates_for_category(session, "goals")
    return [
        {
            "code": t["code"],
            "label": t["label"],
            "emoji": t.get("emoji"),
            "description": t.get("description"),
        }
        for t in templates
    ]


@router.get("/challenges")
def get_challenge_templates(session: Session = Depends(get_session)):
    """Get all active challenge templates."""
    templates = get_active_templates_for_category(session, "challenges")
    return [
        {
            "code": t["code"],
            "label": t["label"],
            "emoji": t.get("emoji"),
            "description": t.get("description"),
        }
        for t in templates
    ]


@router.get("/practices")
def get_practice_templates(session: Session = Depends(get_session)):
    """Get all active practice preference templates."""
    templates = get_active_templates_for_category(session, "practices")
    return [
        {
            "code": t["code"],
            "label": t["label"],
            "emoji": t.get("emoji"),
            "description": t.get("description"),
        }
        for t in templates
    ]


@router.get("/interests")
def get_interest_templates(session: Session = Depends(get_session)):
    """Get all active interest templates."""
    templates = get_active_templates_for_category(session, "interests")
    return [
        {
            "code": t["code"],
            "label": t["label"],
            "emoji": t.get("emoji"),
            "description": t.get("description"),
        }
        for t in templates
    ]


@router.get("/reminders")
def get_reminder_templates(session: Session = Depends(get_session)):
    """Get all active reminder templates."""
    templates = get_active_templates_for_category(session, "reminders")
    return [
        {
            "code": t["code"],
            "label": t["label"],
            "emoji": t.get("emoji"),
            "description": t.get("description"),
        }
        for t in templates
    ]


@router.get("/onboarding", response_model=List[PersonalizationTemplateViewResponse])
def get_onboarding_templates_view(session: Session = Depends(get_session)):
    """
    Get all personalization templates ordered by view_order for onboarding flow.
    
    Returns templates for all onboarding screens (excluding consent) in the correct order:
    1. basic (form)
    2. lifestyle (form)
    3. goals (multi)
    4. challenges (multi)
    5. practice/practices (multi)
    6. experience_levels (single)
    7. mood_tendencies (single)
    8. practice_times (single)
    9. reminders (multi)
    10. interests (multi)
    
    Each response includes screen metadata (title, subtitle, icon, type) and available templates.
    """
    # Get all templates ordered by view_order (excluding consent)
    statement = select(PersonalizationTemplate).where(
        PersonalizationTemplate.view_order > 0
    ).order_by(PersonalizationTemplate.view_order)
    
    template_records = session.exec(statement).all()
    
    # Convert to response format
    result = []
    for record in template_records:
        # Convert templates to TemplateItemResponse
        template_items = [
            TemplateItemResponse(
                code=t.get("code", ""),
                label=t.get("label", ""),
                emoji=t.get("emoji"),
                description=t.get("description"),
                display_order=t.get("display_order", 0),
                is_active=t.get("is_active", True),
            )
            for t in (record.templates or [])
            if t.get("is_active", True)  # Only include active templates
        ]
        
        # Sort template items by display_order
        template_items.sort(key=lambda x: x.display_order)
        
        # Convert fields to FieldDefinitionResponse
        field_definitions = []
        for field in (record.fields or []):
            try:
                # Handle None values and type conversions
                field_dict = dict(field)
                # Convert None to None (not string "None")
                for key, value in field_dict.items():
                    if value == "None" or value == "null":
                        field_dict[key] = None
                
                # Frontend compatibility: ensure 'type' field exists (FormFields checks field.type)
                # If field_type exists but type doesn't, copy field_type to type
                if 'field_type' in field_dict and 'type' not in field_dict:
                    field_dict['type'] = field_dict['field_type']
                # Also handle time_range -> time for frontend compatibility
                if field_dict.get('type') == 'time_range':
                    field_dict['type'] = 'time'  # Frontend TimePicker handles both
                
                # Ensure dropdown options have 'id' field for frontend compatibility
                if field_dict.get('options') and isinstance(field_dict['options'], list):
                    for opt in field_dict['options']:
                        if isinstance(opt, dict) and 'code' in opt and 'id' not in opt:
                            opt['id'] = opt['code']  # Use code as id if id not present
                
                field_definitions.append(FieldDefinitionResponse(**field_dict))
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to parse field {field.get('field_key', 'unknown')}: {e}")
                # Skip invalid fields
                continue
        
        result.append(PersonalizationTemplateViewResponse(
            id=record.id,
            category=record.category,
            view_order=record.view_order,
            screen_key=record.screen_key,
            screen_title=record.screen_title,
            screen_subtitle=record.screen_subtitle,
            screen_type=record.screen_type,
            screen_icon=record.screen_icon,
            templates=template_items,
            fields=field_definitions,
            version=record.version,
            created_at=record.created_at,
            updated_at=record.updated_at,
        ))
    
    # If no templates in database, log warning and return empty list
    # In production, database should always be seeded via init.sql or seed_templates()
    if not result:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning("No templates found in database. Please run seed_templates() or init.sql to populate templates.")
        # Return empty list - frontend should handle empty state
        # For development, you can uncomment the fallback below if needed
        # return _get_defaults_fallback()
    
    return result


def _get_defaults_fallback() -> List[PersonalizationTemplateViewResponse]:
    """
    Fallback to defaults if database is empty (development only).
    This should not be used in production - database should always be seeded.
    """
    from app.utils.personalization_defaults import SCREEN_METADATA
    from uuid import uuid4
    
    defaults = get_all_defaults()
    metadata_items = sorted(SCREEN_METADATA.items(), key=lambda x: x[1].get("view_order", 0))
    
    result = []
    for category, metadata in metadata_items:
        templates = defaults.get(category, [])
        template_items = [
            TemplateItemResponse(
                code=t.get("code", ""),
                label=t.get("label", ""),
                emoji=t.get("emoji"),
                display_order=t.get("display_order", 0),
                is_active=t.get("is_active", True),
            )
            for t in templates
            if isinstance(t, dict) and t.get("is_active", True)
        ]
        template_items.sort(key=lambda x: x.display_order)
        
        result.append(PersonalizationTemplateViewResponse(
            id=uuid4(),
            category=category,
            view_order=metadata.get("view_order", 0),
            screen_key=metadata.get("screen_key"),
            screen_title=metadata.get("screen_title"),
            screen_subtitle=metadata.get("screen_subtitle"),
            screen_type=metadata.get("screen_type"),
            screen_icon=metadata.get("screen_icon"),
            templates=template_items,
            version=1,
            created_at=datetime.utcnow(),
            updated_at=None,
        ))
    
    return result
