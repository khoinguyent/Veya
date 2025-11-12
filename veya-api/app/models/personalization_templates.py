"""
Template models for personalization options using JSONB.
All templates are stored in a single table with JSONB column for flexibility.
"""
from datetime import datetime
from typing import Optional, Dict, List, Any
from sqlmodel import SQLModel, Field, Column, JSON
from uuid import uuid4, UUID


class PersonalizationTemplate(SQLModel, table=True):
    """Single table storing all personalization templates in JSONB format."""
    __tablename__ = "personalization_templates"
    
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    
    # Template category: basic, lifestyle, goals, challenges, practices, interests, reminders, etc.
    category: str = Field(index=True, unique=True)
    
    # View order: determines the order of screens in onboarding flow (1-10, excluding consent)
    view_order: int = Field(default=0, index=True)
    
    # Screen metadata
    screen_key: Optional[str] = Field(default=None)  # Frontend screen key (basic, lifestyle, goals, etc.)
    screen_title: Optional[str] = Field(default=None)  # Screen title
    screen_subtitle: Optional[str] = Field(default=None)  # Screen subtitle
    screen_type: Optional[str] = Field(default=None)  # Screen type: form, multi, single, consent
    screen_icon: Optional[str] = Field(default=None)  # Screen icon emoji
    
    # Templates stored as JSONB array of objects (empty for form screens like basic, lifestyle)
    # Structure: [
    #   {"code": "reduce_stress", "label": "Reduce stress", "emoji": "🌿", "display_order": 1, "is_active": true},
    #   ...
    # ]
    templates: List[Dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column(JSON)
    )
    
    # Field definitions for form screens (basic, lifestyle, consent)
    # Structure: [
    #   {
    #     "field_key": "name",
    #     "field_type": "text",
    #     "label": "Name",
    #     "data_type": "string",
    #     "required": true,
    #     ...
    #   },
    #   ...
    # ]
    fields: List[Dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column(JSON)
    )
    
    # Metadata
    version: int = Field(default=1)  # For versioning/tracking changes
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
