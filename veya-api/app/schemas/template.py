"""
Schemas for personalization templates.
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class TemplateItemResponse(BaseModel):
    """Individual template item (option) within a category."""
    code: str
    label: str
    emoji: Optional[str] = None
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class FieldDefinitionResponse(BaseModel):
    """Field definition for form screens."""
    field_key: str
    field_type: str  # text, dropdown, time, time_range, multi_select, single_select, switch
    type: Optional[str] = None  # Frontend compatibility (FormFields checks field.type)
    label: str
    placeholder: Optional[str] = None
    data_type: str  # string, array, boolean
    required: bool = True
    optional: bool = False
    validation: Optional[Dict[str, Any]] = None
    keyboard_type: Optional[str] = None  # default, numeric, email, phone
    options: Optional[List[Dict[str, Any]]] = None  # Changed to Any to support id field
    options_source: Optional[str] = None  # static, template_category
    templates_category: Optional[str] = None
    min_selections: Optional[int] = None
    max_selections: Optional[int] = None
    display_style: Optional[str] = None  # grid, list
    format: Optional[str] = None  # HH:mm, HH:mm - HH:mm
    allow_range: Optional[bool] = None
    default_value: Optional[Any] = None  # Can be string (for time/text) or boolean (for switch)
    time_picker_config: Optional[Dict[str, Any]] = None
    consent_text: Optional[str] = None
    name: Optional[str] = None  # Frontend compatibility (mapped from field_key)


class PersonalizationTemplateViewResponse(BaseModel):
    """Personalization template view with screen metadata, ordered by view_order."""
    id: UUID
    category: str
    view_order: int
    screen_key: Optional[str] = None
    screen_title: Optional[str] = None
    screen_subtitle: Optional[str] = None
    screen_type: Optional[str] = None  # form, multi, single, consent
    screen_icon: Optional[str] = None
    templates: List[TemplateItemResponse] = []
    fields: List[FieldDefinitionResponse] = []  # Field definitions for form screens
    version: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
