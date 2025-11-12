from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field


class LibraryCategoryTreeResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    summary: Optional[str] = None
    description: Optional[str] = None
    node_type: str = "category"
    accent_color: Optional[str] = None
    icon: Optional[str] = None
    cover_image_url: Optional[str] = None
    order_index: int
    is_active: bool
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    children: List["LibraryCategoryTreeResponse"] = Field(default_factory=list)

    class Config:
        arbitrary_types_allowed = True
        from_attributes = True


LibraryCategoryTreeResponse.model_rebuild()


class LibraryTopicSummaryResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    summary: Optional[str] = None
    cover_image_url: Optional[str] = None
    order_index: int
    article_count: int = 0
    tags: List[str] = Field(default_factory=list)
    accent_color: Optional[str] = None
    is_active: bool = True
    node_type: str = "topic"

    class Config:
        from_attributes = True


class LibraryArticleSummaryResponse(BaseModel):
    id: UUID
    node_id: UUID
    slug: str
    title: str
    subtitle: Optional[str] = None
    hero_image_url: Optional[str] = None
    content_type: str
    layout_variant: Optional[str] = None
    presentation_style: str = "single_page"
    presentation_config: Dict[str, Any] = Field(default_factory=dict)
    reading_time_minutes: Optional[int] = None
    duration_seconds: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    is_published: bool
    published_at: Optional[datetime] = None
    metadata: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class LibraryArticleBlockResponse(BaseModel):
    position: int
    block_type: str
    payload: Dict[str, Any]
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        from_attributes = True


class LibraryTopicDetailResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    summary: Optional[str] = None
    cover_image_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    node_type: str = "topic"
    category: Optional[LibraryCategoryTreeResponse] = None
    parent: Optional[LibraryTopicSummaryResponse] = None
    articles: List[LibraryArticleSummaryResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True


class LibraryArticleDetailResponse(BaseModel):
    id: UUID
    slug: str
    title: str
    subtitle: Optional[str] = None
    hero_image_url: Optional[str] = None
    hero_video_url: Optional[str] = None
    audio_url: Optional[str] = None
    transcript_url: Optional[str] = None
    content_locale: str
    content_type: str
    layout_variant: Optional[str] = None
    presentation_style: str = "single_page"
    presentation_config: Dict[str, Any] = Field(default_factory=dict)
    reading_time_minutes: Optional[int] = None
    duration_seconds: Optional[int] = None
    tags: List[str] = Field(default_factory=list)
    is_published: bool
    published_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    topic: Optional[LibraryTopicSummaryResponse] = None
    blocks: List[LibraryArticleBlockResponse] = []

    class Config:
        from_attributes = True


class LibrarySearchHit(BaseModel):
    type: str  # category | topic | article
    id: UUID
    slug: str
    title: str
    subtitle: Optional[str] = None
    context: Optional[str] = None
    accent_color: Optional[str] = None
    cover_image_url: Optional[str] = None
    node_type: Optional[str] = None


class LibrarySearchResponse(BaseModel):
    query: str
    categories: List[LibraryCategoryTreeResponse] = Field(default_factory=list)
    topics: List[LibraryTopicSummaryResponse] = Field(default_factory=list)
    articles: List[LibraryArticleSummaryResponse] = Field(default_factory=list)
    hits: List[LibrarySearchHit] = Field(default_factory=list)
