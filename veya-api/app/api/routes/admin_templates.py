"""
Admin routes for managing personalization templates.
Requires superuser authentication.
Templates are stored as JSONB in a single table per category.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.db.database import get_session
from app.models.user import User
from app.core.dependencies import get_current_user
from app.models.personalization_templates import PersonalizationTemplate
from app.utils.template_seeder import seed_templates, reset_templates_to_defaults, get_active_templates_for_category

router = APIRouter(prefix="/admin/templates", tags=["admin-templates"])


def require_superuser(current_user: User = Depends(get_current_user)) -> User:
    """Require superuser access."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superuser access required"
        )
    return current_user


# Schema for template operations
class TemplateItem(BaseModel):
    """Individual template item."""
    code: str
    label: str
    emoji: Optional[str] = None
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class CategoryTemplatesUpdate(BaseModel):
    """Update templates for a category."""
    templates: List[TemplateItem]


@router.get("/{category}")
def get_category_templates(
    category: str,
    session: Session = Depends(get_session),
    admin: User = Depends(require_superuser),
):
    """Get all templates for a category (including inactive)."""
    valid_categories = ["goals", "challenges", "practices", "interests", "reminders"]
    if category not in valid_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
        )
    
    statement = select(PersonalizationTemplate).where(
        PersonalizationTemplate.category == category
    )
    template_record = session.exec(statement).first()
    
    if not template_record:
        return {"category": category, "templates": [], "version": 0}
    
    return {
        "category": category,
        "templates": template_record.templates,
        "version": template_record.version,
    }


@router.put("/{category}")
def update_category_templates(
    category: str,
    templates_update: CategoryTemplatesUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_superuser),
):
    """Update all templates for a category."""
    valid_categories = ["goals", "challenges", "practices", "interests", "reminders"]
    if category not in valid_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
        )
    
    # Convert to dict format
    templates_list = [t.model_dump() for t in templates_update.templates]
    
    statement = select(PersonalizationTemplate).where(
        PersonalizationTemplate.category == category
    )
    template_record = session.exec(statement).first()
    
    if template_record:
        template_record.templates = templates_list
        template_record.updated_at = datetime.utcnow()
        template_record.version += 1
    else:
        template_record = PersonalizationTemplate(
            category=category,
            templates=templates_list,
            version=1,
        )
        session.add(template_record)
    
    session.commit()
    session.refresh(template_record)
    
    return {
        "message": f"Templates updated for category: {category}",
        "category": category,
        "templates": template_record.templates,
        "version": template_record.version,
    }


@router.post("/{category}/add")
def add_template_to_category(
    category: str,
    template_item: TemplateItem,
    session: Session = Depends(get_session),
    admin: User = Depends(require_superuser),
):
    """Add a new template to a category."""
    valid_categories = ["goals", "challenges", "practices", "interests", "reminders"]
    if category not in valid_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
        )
    
    statement = select(PersonalizationTemplate).where(
        PersonalizationTemplate.category == category
    )
    template_record = session.exec(statement).first()
    
    if not template_record:
        # Create new category with this template
        template_record = PersonalizationTemplate(
            category=category,
            templates=[template_item.model_dump()],
            version=1,
        )
        session.add(template_record)
    else:
        # Check if code already exists
        existing_codes = {t["code"] for t in template_record.templates}
        if template_item.code in existing_codes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template with code '{template_item.code}' already exists in category '{category}'"
            )
        
        # Add new template
        templates_list = template_record.templates.copy()
        templates_list.append(template_item.model_dump())
        template_record.templates = templates_list
        template_record.updated_at = datetime.utcnow()
        template_record.version += 1
    
    session.commit()
    session.refresh(template_record)
    
    return {
        "message": f"Template added to category: {category}",
        "template": template_item.model_dump(),
    }


@router.delete("/{category}/{template_code}")
def delete_template_from_category(
    category: str,
    template_code: str,
    session: Session = Depends(get_session),
    admin: User = Depends(require_superuser),
):
    """Delete (deactivate) a template from a category."""
    valid_categories = ["goals", "challenges", "practices", "interests", "reminders"]
    if category not in valid_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
        )
    
    statement = select(PersonalizationTemplate).where(
        PersonalizationTemplate.category == category
    )
    template_record = session.exec(statement).first()
    
    if not template_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{category}' not found"
        )
    
    # Find and deactivate the template
    templates_list = template_record.templates.copy()
    found = False
    for template in templates_list:
        if template["code"] == template_code:
            template["is_active"] = False
            found = True
            break
    
    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with code '{template_code}' not found in category '{category}'"
        )
    
    template_record.templates = templates_list
    template_record.updated_at = datetime.utcnow()
    template_record.version += 1
    
    session.commit()
    
    return {"message": f"Template '{template_code}' deactivated in category '{category}'"}


@router.post("/seed-defaults")
def seed_default_templates(
    overwrite: bool = False,
    session: Session = Depends(get_session),
    admin: User = Depends(require_superuser),
):
    """Seed default templates into the database."""
    result = seed_templates(session, overwrite=overwrite)
    return result


@router.post("/reset-defaults")
def reset_to_default_templates(
    session: Session = Depends(get_session),
    admin: User = Depends(require_superuser),
):
    """Reset all templates to default values."""
    result = reset_templates_to_defaults(session)
    return result
