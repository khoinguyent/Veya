from datetime import datetime, date
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, Relationship, Column, JSON, UniqueConstraint

if TYPE_CHECKING:  # pragma: no cover
    from app.models.user import User
    from app.models.library import LibraryArticle


class PracticeProgram(SQLModel, table=True):
    __tablename__ = "practice_programs"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_practice_program_slug"),
    )

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    slug: str = Field(index=True, nullable=False)
    title: str = Field(nullable=False)
    short_description: Optional[str] = Field(default=None, sa_column_kwargs={"nullable": True})
    level: Optional[str] = Field(default=None, sa_column_kwargs={"nullable": True})
    category: Optional[str] = Field(default=None, sa_column_kwargs={"nullable": True})
    duration_days: int = Field(default=1, ge=1)
    is_featured: bool = Field(default=False, index=True)
    cover_image_url: Optional[str] = Field(default=None)
    hero_audio_url: Optional[str] = Field(default=None)
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    metadata_: Dict[str, Any] = Field(default_factory=dict, sa_column=Column("metadata", JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    steps: List["PracticeStep"] = Relationship(
        back_populates="program",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    enrollments: List["PracticeEnrollment"] = Relationship(back_populates="program")


class PracticeStep(SQLModel, table=True):
    __tablename__ = "practice_steps"
    __table_args__ = (
        UniqueConstraint("program_id", "order_index", name="uq_practice_step_order"),
    )

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    program_id: UUID = Field(foreign_key="practice_programs.id", nullable=False)
    order_index: int = Field(default=1, ge=1)
    title: str = Field(nullable=False)
    subtitle: Optional[str] = Field(default=None)
    day_label: Optional[str] = Field(default=None)  # e.g. "Day 1"
    est_duration_minutes: Optional[int] = Field(default=None)
    guide_type: Optional[str] = Field(default=None)  # e.g. "article", "audio", "video"
    guide_reference: Optional[str] = Field(default=None)  # article slug, resource id, etc.
    metadata_: Dict[str, Any] = Field(default_factory=dict, sa_column=Column("metadata", JSON))

    program: PracticeProgram = Relationship(back_populates="steps")


class PracticeEnrollment(SQLModel, table=True):
    __tablename__ = "practice_enrollments"
    __table_args__ = (
        UniqueConstraint("user_id", "program_id", name="uq_practice_enrollment_user_program"),
    )

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", nullable=False)
    program_id: UUID = Field(foreign_key="practice_programs.id", nullable=False)

    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)
    last_practiced_at: Optional[datetime] = Field(default=None)
    current_step_index: int = Field(default=1, ge=1)
    streak_count: int = Field(default=0)
    longest_streak: int = Field(default=0)
    total_completions: int = Field(default=0)
    notes: Optional[str] = Field(default=None)

    program: "PracticeProgram" = Relationship(back_populates="enrollments")
    user: "User" = Relationship(back_populates="practice_enrollments")
    sessions: List["PracticeSessionLog"] = Relationship(
        back_populates="enrollment",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class PracticeSessionLog(SQLModel, table=True):
    __tablename__ = "practice_session_logs"

    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    enrollment_id: UUID = Field(foreign_key="practice_enrollments.id", nullable=False)
    program_id: UUID = Field(foreign_key="practice_programs.id", nullable=False)
    step_id: Optional[UUID] = Field(foreign_key="practice_steps.id", nullable=True)
    user_id: UUID = Field(foreign_key="users.id", nullable=False)

    practiced_on: date = Field(default_factory=lambda: datetime.utcnow().date(), index=True)
    practiced_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    completed: bool = Field(default=True)
    minutes_practiced: Optional[int] = Field(default=None)
    streak_after: Optional[int] = Field(default=None)
    metadata_: Dict[str, Any] = Field(default_factory=dict, sa_column=Column("metadata", JSON))

    enrollment: "PracticeEnrollment" = Relationship(back_populates="sessions")
    program: "PracticeProgram" = Relationship()
    step: Optional["PracticeStep"] = Relationship()
