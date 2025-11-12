"""
Utility to seed default personalization templates into the database.
Templates are stored as JSONB in a single table per category.
"""
from sqlmodel import Session, select, text
from app.models.personalization_templates import PersonalizationTemplate
from app.utils.personalization_defaults import get_default_templates, SCREEN_METADATA, get_default_fields
from datetime import datetime


def seed_templates(session: Session, overwrite: bool = False, clear_existing: bool = False):
    """
    Seed default templates into the database.
    Creates one record per category with templates as JSONB array.
    
    Args:
        session: Database session
        overwrite: If True, update existing templates. If False, skip existing ones.
        clear_existing: If True, delete all existing templates before seeding.
    """
    # Clear existing data if requested
    if clear_existing:
        session.exec(text("DELETE FROM personalization_templates"))
        session.commit()
        print("✅ Cleared all existing template records")
    
    defaults = get_default_templates()
    default_fields = get_default_fields()
    
    for category, templates in defaults.items():
        # Get screen metadata
        metadata = SCREEN_METADATA.get(category, {})
        # Get field definitions for this category or screen_key
        screen_key = metadata.get("screen_key", category)
        fields = default_fields.get(category, []) or default_fields.get(screen_key, [])
        
        # Check if category already exists
        statement = select(PersonalizationTemplate).where(
            PersonalizationTemplate.category == category
        )
        existing = session.exec(statement).first()
        
        if existing:
            if overwrite:
                existing.templates = templates
                existing.fields = fields
                existing.view_order = metadata.get("view_order", 0)
                existing.screen_key = metadata.get("screen_key")
                existing.screen_title = metadata.get("screen_title")
                existing.screen_subtitle = metadata.get("screen_subtitle")
                existing.screen_type = metadata.get("screen_type")
                existing.screen_icon = metadata.get("screen_icon")
                existing.updated_at = datetime.utcnow()
                existing.version += 1
                session.add(existing)
        else:
            # Create new template record for this category
            template_record = PersonalizationTemplate(
                category=category,
                templates=templates,
                fields=fields,
                view_order=metadata.get("view_order", 0),
                screen_key=metadata.get("screen_key"),
                screen_title=metadata.get("screen_title"),
                screen_subtitle=metadata.get("screen_subtitle"),
                screen_type=metadata.get("screen_type"),
                screen_icon=metadata.get("screen_icon"),
                version=1,
            )
            session.add(template_record)
    
    session.commit()
    return {"message": "Templates seeded successfully"}


def reset_templates_to_defaults(session: Session):
    """
    Reset all templates to default values.
    This will update existing templates and create missing ones.
    """
    return seed_templates(session, overwrite=True)


def get_active_templates_for_category(session: Session, category: str) -> list:
    """
    Get active templates for a specific category from the database.
    
    Args:
        session: Database session
        category: Template category (goals, challenges, practices, interests, reminders, etc.)
    
    Returns:
        List of active template objects from database
        Returns empty list if category not found (should seed database first)
    
    Note:
        This function queries the database. If templates are not found, returns empty list.
        In production, database should always be seeded via init.sql or seed_templates().
        Defaults file is only used for seeding, not for runtime data.
    """
    statement = select(PersonalizationTemplate).where(
        PersonalizationTemplate.category == category
    )
    template_record = session.exec(statement).first()
    
    if not template_record:
        # Return empty list - database should be seeded
        # Do not fallback to defaults - data should come from database
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Template category '{category}' not found in database. Please run seed_templates() or init.sql.")
        return []
    
    # Filter to only active templates
    active_templates = [
        t for t in template_record.templates 
        if t.get("is_active", True)
    ]
    
    # Sort by display_order
    active_templates.sort(key=lambda x: x.get("display_order", 0))
    
    return active_templates
