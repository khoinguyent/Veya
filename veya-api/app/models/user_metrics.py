from datetime import datetime
from typing import Optional, TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:  # pragma: no cover - circular import for type checking only
    from app.models.user import User


class UserMetrics(SQLModel, table=True):
    """Aggregated user statistics for profile and dashboard views."""

    __tablename__ = "user_metrics"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", unique=True, index=True)

    day_streak: int = Field(default=0)
    longest_streak: int = Field(default=0)
    total_checkins: int = Field(default=0)
    badges_count: int = Field(default=0)
    minutes_practiced: int = Field(default=0)
    last_checkin_at: Optional[datetime] = Field(default=None)

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    # Relationships
    user: "User" = Relationship(back_populates="metrics")
