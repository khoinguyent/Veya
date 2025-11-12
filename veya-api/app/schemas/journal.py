from __future__ import annotations

from datetime import datetime, date
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class JournalEntryBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    prompt: Optional[str] = None
    emoji: Optional[str] = Field(default=None, max_length=8)
    note: Optional[str] = Field(default=None, max_length=2000)
    tags: List[str] = Field(default_factory=list)
    mood: Optional[str] = None
    source: Optional[str] = None
    is_favorite: Optional[bool] = None
    local_date: Optional[date] = None
    local_timezone: Optional[str] = None
    sentiment_score: Optional[float] = None
    weather_snapshot: Dict[str, Any] = Field(default_factory=dict)
    attachments: List[Dict[str, Any]] = Field(default_factory=list)
    metadata_: Dict[str, Any] = Field(default_factory=dict, alias="metadata")
    created_from_device: Optional[str] = None


class JournalEntryCreate(JournalEntryBase):
    note: str = Field(..., max_length=2000)


class JournalEntryUpdate(JournalEntryBase):
    note: Optional[str] = Field(default=None, max_length=2000)
    archived_at: Optional[datetime] = None


class JournalEntryResponse(JournalEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    local_date: date
    local_timezone: str
    sequence_in_day: int
    word_count: Optional[int]
    created_local_at: Optional[datetime]
    updated_local_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    archived_at: Optional[datetime]

class JournalEntryListResponse(BaseModel):
    items: List[JournalEntryResponse]
    next_cursor: Optional[str] = None


class JournalTimelineDay(BaseModel):
    local_date: date
    entry_count: int
    favorite_count: int
    moods: Dict[str, int] = Field(default_factory=dict)
    tags: Dict[str, int] = Field(default_factory=dict)
    last_entry_at: Optional[datetime] = None


class JournalTimelineResponse(BaseModel):
    days: List[JournalTimelineDay] = Field(default_factory=list)
    total_entries: int = 0
    favorite_entries: int = 0
    first_entry_at: Optional[datetime] = None
    latest_entry_at: Optional[datetime] = None


class JournalFavoriteRequest(BaseModel):
    is_favorite: bool = True
