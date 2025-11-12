from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class MoodEntryBase(BaseModel):
    mood_value: str  # 'great', 'good', 'neutral', 'bad', 'terrible'
    note: Optional[str] = None


class MoodEntryCreate(MoodEntryBase):
    pass


class MoodEntryLog(MoodEntryBase):
    pass


class MoodEntryResponse(MoodEntryBase):
    id: UUID
    user_id: UUID
    logged_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

