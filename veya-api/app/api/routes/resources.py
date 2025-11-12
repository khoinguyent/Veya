"""
Resource management routes for media assets.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query, Response
from sqlmodel import Session, select, or_
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import mimetypes
import hashlib
from pathlib import Path

from app.db.database import get_session
from app.models.resource import Resource, ResourceType, ResourceCategory
from app.schemas.resource import (
    ResourceCreate,
    ResourceUpdate,
    ResourceResponse,
    ResourceListResponse,
    ResourceUploadResponse,
)
from app.core.dependencies import get_current_user
from app.models.user import User
from app.core.r2_client import (
    upload_file_to_r2,
    delete_file_from_r2,
    get_r2_public_url,
    get_presigned_url,
    check_file_exists,
)

router = APIRouter(prefix="/resources", tags=["resources"])


def generate_r2_key(resource_type: ResourceType, category: ResourceCategory, slug: str, extension: str) -> str:
    """
    Generate R2 key (path) for resource.
    Format: {category}/{resource_type}/{slug}.{extension}
    Example: onboarding/illustration/relaxed-illustration.svg
    """
    return f"{category.value}/{resource_type.value}/{slug}.{extension}"


@router.post("/upload", response_model=ResourceUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resource(
    file: UploadFile = File(...),
    name: str = Form(...),
    slug: str = Form(...),
    description: Optional[str] = Form(None),
    resource_type: ResourceType = Form(...),
    category: ResourceCategory = Form(ResourceCategory.OTHER),
    tags: Optional[str] = Form(None),  # Comma-separated tags
    is_public: bool = Form(True),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a resource file to Cloudflare R2.
    Requires authentication.
    """
    # Check if slug already exists
    existing = session.exec(select(Resource).where(Resource.slug == slug)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Resource with slug '{slug}' already exists"
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Determine file extension and MIME type
    filename = file.filename or slug
    file_extension = Path(filename).suffix.lstrip('.') or 'bin'
    mime_type = file.content_type or mimetypes.guess_type(filename)[0] or 'application/octet-stream'
    
    # Generate R2 key
    r2_key = generate_r2_key(resource_type, category, slug, file_extension)
    
    # Check if file already exists in R2 (optional - can overwrite)
    if check_file_exists(r2_key):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File already exists in R2: {r2_key}"
        )
    
    # Upload to R2
    success = upload_file_to_r2(
        file_content=file_content,
        r2_key=r2_key,
        content_type=mime_type,
        metadata={
            'name': name,
            'slug': slug,
            'resource_type': resource_type.value,
            'category': category.value,
        }
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload file to R2"
        )
    
    # Parse tags
    tag_list = []
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
    
    # Generate public URL
    public_url = get_r2_public_url(r2_key)
    
    # Create resource record
    from app.core.config import settings
    
    resource = Resource(
        name=name,
        slug=slug,
        description=description,
        resource_type=resource_type,
        category=category,
        mime_type=mime_type,
        file_extension=file_extension,
        r2_key=r2_key,
        r2_bucket=settings.r2_bucket_name,
        public_url=public_url,
        file_size=file_size,
        tags=tag_list,
        is_public=is_public,
        uploaded_at=datetime.utcnow(),
    )
    
    session.add(resource)
    session.commit()
    session.refresh(resource)
    
    return ResourceUploadResponse(resource=ResourceResponse.model_validate(resource))


@router.get("/", response_model=ResourceListResponse)
def list_resources(
    category: Optional[ResourceCategory] = Query(None),
    resource_type: Optional[ResourceType] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    tags: Optional[str] = Query(None),  # Comma-separated tags
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    session: Session = Depends(get_session),
):
    """
    List resources with filtering and pagination.
    Public endpoint - no authentication required.
    """
    statement = select(Resource)
    
    # Apply filters
    filters = []
    if category:
        filters.append(Resource.category == category)
    if resource_type:
        filters.append(Resource.resource_type == resource_type)
    if is_active is not None:
        filters.append(Resource.is_active == is_active)
    else:
        # Default to active only
        filters.append(Resource.is_active == True)
    
    if search:
        filters.append(
            or_(
                Resource.name.ilike(f"%{search}%"),
                Resource.description.ilike(f"%{search}%"),
                Resource.slug.ilike(f"%{search}%"),
            )
        )
    
    if tags:
        tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()]
        # Filter by tags (tags is JSON array)
        for tag in tag_list:
            filters.append(Resource.tags.contains([tag]))
    
    if filters:
        for filter_condition in filters:
            statement = statement.where(filter_condition)
    
    # Get total count
    count_statement = select(Resource).where(*filters) if filters else select(Resource)
    total = len(session.exec(count_statement).all())
    
    # Apply pagination
    offset = (page - 1) * page_size
    statement = statement.offset(offset).limit(page_size)
    
    # Order by created_at descending
    statement = statement.order_by(Resource.created_at.desc())
    
    resources = session.exec(statement).all()
    
    return ResourceListResponse(
        resources=[ResourceResponse.model_validate(r) for r in resources],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{identifier}", response_model=ResourceResponse)
def get_resource(
    identifier: str,
    session: Session = Depends(get_session),
):
    """
    Get a resource by ID (UUID) or slug.
    Public endpoint - no authentication required.
    """
    # Try to parse as UUID first
    try:
        resource_id = UUID(identifier)
        resource = session.exec(select(Resource).where(Resource.id == resource_id)).first()
    except ValueError:
        # Not a UUID, try slug
        resource = session.exec(select(Resource).where(Resource.slug == identifier)).first()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource not found: {identifier}"
        )
    
    if not resource.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource is not active"
        )
    
    # Update usage tracking
    resource.usage_count += 1
    resource.last_used_at = datetime.utcnow()
    session.add(resource)
    session.commit()
    
    return ResourceResponse.model_validate(resource)


@router.get("/{identifier}/url", response_model=dict)
def get_resource_url(
    identifier: str,
    presigned: bool = Query(False, description="Generate presigned URL for private resources"),
    expiration: int = Query(3600, ge=60, le=604800, description="Presigned URL expiration in seconds"),
    session: Session = Depends(get_session),
):
    """
    Get resource URL (public or presigned).
    Public endpoint - no authentication required.
    """
    # Try to parse as UUID first
    try:
        resource_id = UUID(identifier)
        resource = session.exec(select(Resource).where(Resource.id == resource_id)).first()
    except ValueError:
        # Not a UUID, try slug
        resource = session.exec(select(Resource).where(Resource.slug == identifier)).first()
    
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource not found: {identifier}"
        )
    
    if not resource.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource is not active"
        )
    
    # Return public URL or presigned URL
    if presigned or not resource.is_public:
        url = get_presigned_url(resource.r2_key, expiration=expiration)
        if not url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate presigned URL"
            )
        return {
            "url": url,
            "type": "presigned",
            "expires_in": expiration,
        }
    else:
        return {
            "url": resource.public_url,
            "type": "public",
        }


@router.put("/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: UUID,
    resource_update: ResourceUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update a resource.
    Requires authentication.
    """
    resource = session.exec(select(Resource).where(Resource.id == resource_id)).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Check if slug is being updated and if it's already taken
    if resource_update.slug and resource_update.slug != resource.slug:
        existing = session.exec(select(Resource).where(Resource.slug == resource_update.slug)).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Resource with slug '{resource_update.slug}' already exists"
            )
    
    # Update fields
    update_data = resource_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(resource, key, value)
    
    resource.updated_at = datetime.utcnow()
    session.add(resource)
    session.commit()
    session.refresh(resource)
    
    return ResourceResponse.model_validate(resource)


@router.delete(
    "/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_resource(
    resource_id: UUID,
    delete_file: bool = Query(True, description="Delete file from R2"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Response:
    """
    Delete a resource.
    Requires authentication.
    Optionally deletes the file from R2.
    """
    resource = session.exec(select(Resource).where(Resource.id == resource_id)).first()
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found"
        )
    
    # Delete file from R2 if requested
    if delete_file:
        delete_file_from_r2(resource.r2_key)
    
    # Delete resource record
    session.delete(resource)
    session.commit()
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/by-category/{category}", response_model=List[ResourceResponse])
def get_resources_by_category(
    category: ResourceCategory,
    resource_type: Optional[ResourceType] = Query(None),
    session: Session = Depends(get_session),
):
    """
    Get all resources for a specific category.
    Public endpoint - no authentication required.
    """
    statement = select(Resource).where(
        Resource.category == category,
        Resource.is_active == True
    )
    
    if resource_type:
        statement = statement.where(Resource.resource_type == resource_type)
    
    statement = statement.order_by(Resource.created_at.desc())
    
    resources = session.exec(statement).all()
    return [ResourceResponse.model_validate(r) for r in resources]

