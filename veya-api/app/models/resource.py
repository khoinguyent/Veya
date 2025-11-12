"""
Resource models for storing media assets (illustrations, sounds, etc.) metadata.
Actual files are stored in Cloudflare R2, this model stores metadata and URLs.
"""
from datetime import datetime
from typing import Optional, List
from sqlmodel import SQLModel, Field, Column, JSON
from uuid import uuid4, UUID
from enum import Enum


class ResourceType(str, Enum):
    """Resource type enumeration."""
    ILLUSTRATION = "illustration"
    SOUND = "sound"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    OTHER = "other"


class ResourceCategory(str, Enum):
    """Resource category for organization."""
    ONBOARDING = "onboarding"
    HOME = "home"
    PROFILE = "profile"
    MEDITATION = "meditation"
    MOOD = "mood"
    BACKGROUND = "background"
    ICON = "icon"
    OTHER = "other"


class Resource(SQLModel, table=True):
    """Resource model for media assets stored in Cloudflare R2."""
    __tablename__ = "resources"
    
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    
    # Identification
    name: str = Field(index=True)  # Human-readable name
    slug: str = Field(unique=True, index=True)  # URL-friendly identifier (e.g., "relaxed-illustration")
    description: Optional[str] = Field(default=None)  # Description of the resource
    
    # Resource metadata
    resource_type: ResourceType = Field(index=True)  # illustration, sound, etc.
    category: ResourceCategory = Field(index=True, default=ResourceCategory.OTHER)  # onboarding, home, etc.
    mime_type: str = Field(default="")  # e.g., "image/svg+xml", "audio/mpeg"
    file_extension: str = Field(default="")  # e.g., "svg", "mp3", "png"
    
    # Cloudflare R2 paths
    r2_key: str = Field(unique=True, index=True)  # R2 object key (full path in bucket)
    r2_bucket: str = Field(default="veya-assets")  # R2 bucket name
    public_url: str = Field(default="")  # Public CDN URL (Cloudflare R2 public URL or custom domain)
    
    # File metadata
    file_size: Optional[int] = Field(default=None)  # Size in bytes
    width: Optional[int] = Field(default=None)  # For images/videos
    height: Optional[int] = Field(default=None)  # For images/videos
    duration: Optional[float] = Field(default=None)  # For audio/video (in seconds)
    
    # Tags and metadata
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))  # Tags for searching
    metadata_: dict = Field(default_factory=dict, sa_column=Column("metadata", JSON))  # Additional metadata
    
    # Usage tracking
    usage_count: int = Field(default=0)  # How many times this resource has been used
    last_used_at: Optional[datetime] = Field(default=None)  # Last time resource was accessed
    
    # Status
    is_active: bool = Field(default=True, index=True)  # Active/inactive flag
    is_public: bool = Field(default=True)  # Whether resource is publicly accessible
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    uploaded_at: Optional[datetime] = Field(default=None)  # When file was uploaded to R2

