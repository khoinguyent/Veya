"""
Resource schemas for API requests and responses.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from app.models.resource import ResourceType, ResourceCategory


class ResourceBase(BaseModel):
    """Base resource schema."""
    name: str
    slug: str
    description: Optional[str] = None
    resource_type: ResourceType
    category: ResourceCategory = ResourceCategory.OTHER
    mime_type: str = ""
    file_extension: str = ""
    tags: List[str] = []
    metadata: Dict[str, Any] = {}
    is_active: bool = True
    is_public: bool = True


class ResourceCreate(ResourceBase):
    """Schema for creating a resource (without file upload)."""
    pass


class ResourceUpdate(BaseModel):
    """Schema for updating a resource."""
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ResourceCategory] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None


class ResourceResponse(ResourceBase):
    """Resource response schema."""
    id: UUID
    r2_key: str
    r2_bucket: str
    public_url: str
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    usage_count: int = 0
    last_used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    uploaded_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ResourceListResponse(BaseModel):
    """Response for listing resources."""
    resources: List[ResourceResponse]
    total: int
    page: int
    page_size: int


class ResourceUploadResponse(BaseModel):
    """Response after uploading a resource."""
    resource: ResourceResponse
    message: str = "Resource uploaded successfully"


class ResourceByIdOrSlug(BaseModel):
    """Schema for identifying resource by ID or slug."""
    identifier: str  # Can be UUID or slug

