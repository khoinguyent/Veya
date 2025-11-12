from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class ProgressSessionBase(BaseModel):
    streak: int = 0
    minutes: int = 0
    session_date: Optional[datetime] = None


class ProgressSessionCreate(ProgressSessionBase):
    pass


class ProgressSessionSync(ProgressSessionBase):
    pass


class ProgressSessionResponse(ProgressSessionBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

