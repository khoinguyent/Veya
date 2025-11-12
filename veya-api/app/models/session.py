from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from uuid import uuid4, UUID

if TYPE_CHECKING:
    from app.models.user import User


class ProgressSession(SQLModel, table=True):
    __tablename__ = "progress_sessions"
    
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id")
    streak: int = Field(default=0)
    minutes: int = Field(default=0)
    session_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: "User" = Relationship(back_populates="sessions")

