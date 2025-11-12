from __future__ import annotations

from datetime import datetime, date
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, Relationship, Column, JSON

from app.models.user import User


class JournalEntry(SQLModel, table=True):
    __tablename__ = "journal_entries"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    prompt: Optional[str] = Field(default=None)
    emoji: Optional[str] = Field(default=None, max_length=8)
    note: str = Field(sa_column_kwargs={"nullable": False})
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    mood: Optional[str] = Field(default=None, index=True)
    source: Optional[str] = Field(default=None, max_length=64)  # e.g., "journal_card"
    is_favorite: bool = Field(default=False, index=True)
    archived_at: Optional[datetime] = Field(default=None, index=True)

    # Timeline metadata
    local_date: date = Field(default_factory=lambda: datetime.utcnow().date(), index=True)
    local_timezone: str = Field(default="UTC", max_length=64)
    created_local_at: Optional[datetime] = Field(default=None)
    updated_local_at: Optional[datetime] = Field(default=None)
    sequence_in_day: int = Field(default=1, index=True)

    # Context metadata
    sentiment_score: Optional[float] = Field(default=None)
    word_count: Optional[int] = Field(default=None)
    weather_snapshot: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    attachments: List[Dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))
    metadata_: Dict[str, Any] = Field(default_factory=dict, sa_column=Column("metadata", JSON))
    created_from_device: Optional[str] = Field(default=None, max_length=64)

    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: Optional[datetime] = Field(default=None)

    user: User = Relationship(back_populates="journal_entries")
