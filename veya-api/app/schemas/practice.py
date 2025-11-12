from __future__ import annotations

from datetime import datetime, date
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class PracticeStepBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str
    subtitle: Optional[str] = None
    day_label: Optional[str] = None
    order_index: int = Field(ge=1)
    est_duration_minutes: Optional[int] = Field(default=None, ge=0)
    guide_type: Optional[str] = None
    guide_reference: Optional[str] = None
    metadata_: Dict[str, Any] = Field(default_factory=dict, alias="metadata")


class PracticeStepCreate(PracticeStepBase):
    pass


class PracticeStepResponse(PracticeStepBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID


class PracticeProgramBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    slug: str
    title: str
    short_description: Optional[str] = None
    level: Optional[str] = None
    category: Optional[str] = None
    duration_days: int = Field(ge=1)
    is_featured: bool = False
    cover_image_url: Optional[str] = None
    hero_audio_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    metadata_: Dict[str, Any] = Field(default_factory=dict, alias="metadata")


class PracticeProgramCreate(PracticeProgramBase):
    steps: List[PracticeStepCreate] = Field(default_factory=list)


class PracticeProgramResponse(PracticeProgramBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    created_at: datetime
    updated_at: Optional[datetime]
    steps: List[PracticeStepResponse] = Field(default_factory=list)


class PracticeEnrollmentBase(BaseModel):
    program_id: UUID


class PracticeEnrollmentCreate(PracticeEnrollmentBase):
    pass


class PracticeEnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    program_id: UUID
    started_at: datetime
    completed_at: Optional[datetime]
    last_practiced_at: Optional[datetime]
    current_step_index: int
    streak_count: int
    longest_streak: int
    total_completions: int

class PracticeSessionLogResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: UUID
    enrollment_id: UUID
    program_id: UUID
    step_id: Optional[UUID]
    practiced_on: date
    practiced_at: datetime
    completed: bool
    minutes_practiced: Optional[int]
    streak_after: Optional[int]
    metadata_: Dict[str, Any] = Field(default_factory=dict, alias="metadata")


class PracticeCompletionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    step_id: UUID
    practiced_at: Optional[datetime] = None
    minutes_practiced: Optional[int] = Field(default=None, ge=0)
    metadata_: Dict[str, Any] = Field(default_factory=dict, alias="metadata")


class PracticeProgramListResponse(BaseModel):
    items: List[PracticeProgramResponse]


class PracticeEnrollmentListResponse(BaseModel):
    enrollments: List[PracticeEnrollmentResponse]
    active_programs: List[PracticeProgramResponse] = Field(default_factory=list)


class PracticeCompletionResponse(BaseModel):
    enrollment: PracticeEnrollmentResponse
    session_log: PracticeSessionLogResponse
    next_step: Optional[PracticeStepResponse] = None
