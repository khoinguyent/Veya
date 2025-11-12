from datetime import datetime
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, Relationship, Column, JSON

if TYPE_CHECKING:  # pragma: no cover
    from app.models.user import User


class LibraryNode(SQLModel, table=True):
    """Unified hierarchical node representing categories, topics, and collections."""

    __tablename__ = "library_nodes"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    parent_id: Optional[UUID] = Field(default=None, foreign_key="library_nodes.id")
    slug: str = Field(unique=True, index=True, sa_column_kwargs={"nullable": False})
    title: str = Field(sa_column_kwargs={"nullable": False})
    summary: Optional[str] = None
    description: Optional[str] = None
    node_type: str = Field(default="category", sa_column_kwargs={"nullable": False})
    accent_color: Optional[str] = Field(default=None, max_length=16)
    icon: Optional[str] = None
    cover_image_url: Optional[str] = None
    order_index: int = Field(default=0, index=True)
    is_active: bool = Field(default=True, index=True)
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    metadata_: Dict[str, Any] = Field(default_factory=dict, sa_column=Column("metadata", JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    parent: Optional["LibraryNode"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "LibraryNode.id"},
    )
    children: List["LibraryNode"] = Relationship(back_populates="parent")

    articles: List["LibraryArticle"] = Relationship(back_populates="node")


class LibraryArticle(SQLModel, table=True):
    __tablename__ = "library_articles"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    node_id: UUID = Field(foreign_key="library_nodes.id", index=True)
    slug: str = Field(unique=True, index=True, sa_column_kwargs={"nullable": False})
    title: str = Field(sa_column_kwargs={"nullable": False})
    subtitle: Optional[str] = None
    hero_image_url: Optional[str] = None
    hero_video_url: Optional[str] = None
    audio_url: Optional[str] = None
    transcript_url: Optional[str] = None
    content_locale: str = Field(default="en-US")
    content_type: str = Field(default="article")
    layout_variant: Optional[str] = Field(default=None)
    presentation_style: str = Field(default="single_page", index=True)  # single_page, paged_blocks
    presentation_config: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    reading_time_minutes: Optional[int] = Field(default=None)
    duration_seconds: Optional[int] = Field(default=None)
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    is_published: bool = Field(default=True, index=True)
    published_at: Optional[datetime] = Field(default=None, index=True)
    metadata_: Dict[str, Any] = Field(default_factory=dict, sa_column=Column("metadata", JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    node: LibraryNode = Relationship(back_populates="articles")
    blocks: List["LibraryArticleBlock"] = Relationship(back_populates="article")


class LibraryArticleBlock(SQLModel, table=True):
    __tablename__ = "library_article_blocks"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    article_id: UUID = Field(foreign_key="library_articles.id", index=True)
    position: int = Field(default=0, index=True)
    block_type: str = Field(sa_column_kwargs={"nullable": False})
    payload: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    metadata_: Dict[str, Any] = Field(default_factory=dict, sa_column=Column("metadata", JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    article: LibraryArticle = Relationship(back_populates="blocks")
