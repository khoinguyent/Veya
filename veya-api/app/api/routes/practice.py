from __future__ import annotations

from datetime import datetime, date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select
from zoneinfo import ZoneInfo

from app.core.dependencies import get_current_user
from app.db.database import get_session
from app.models.practice import (
    PracticeProgram,
    PracticeStep,
    PracticeEnrollment,
    PracticeSessionLog,
)
from app.models.user import User
from app.schemas.practice import (
    PracticeProgramListResponse,
    PracticeProgramResponse,
    PracticeCompletionRequest,
    PracticeCompletionResponse,
    PracticeEnrollmentCreate,
    PracticeEnrollmentListResponse,
    PracticeEnrollmentResponse,
    PracticeSessionLogResponse,
    PracticeStepResponse,
)

router = APIRouter(prefix="/practice", tags=["practice"])


def _get_program(session: Session, program_id: UUID) -> PracticeProgram:
    program = session.get(PracticeProgram, program_id)
    if not program:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")
    return program


def _get_step(session: Session, step_id: UUID) -> PracticeStep:
    step = session.get(PracticeStep, step_id)
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program step not found")
    return step


def _serialize_program(program: PracticeProgram) -> PracticeProgramResponse:
    ordered_steps = sorted(program.steps or [], key=lambda s: s.order_index)
    program.steps = ordered_steps
    return PracticeProgramResponse.model_validate(program)


def _normalize_timezone(user: User) -> str:
    tz = None
    if user.profile and user.profile.timezone:
        tz = user.profile.timezone
    try:
        return tz if tz and ZoneInfo(tz) else "UTC"
    except Exception:  # pragma: no cover
        return "UTC"


def _get_or_create_enrollment(session: Session, user: User, program: PracticeProgram) -> PracticeEnrollment:
    stmt = select(PracticeEnrollment).where(
        PracticeEnrollment.user_id == user.id,
        PracticeEnrollment.program_id == program.id,
    )
    enrollment = session.exec(stmt).first()
    if enrollment:
        return enrollment

    enrollment = PracticeEnrollment(
        user_id=user.id,
        program_id=program.id,
        current_step_index=1,
        streak_count=0,
        longest_streak=0,
        total_completions=0,
    )
    session.add(enrollment)
    session.commit()
    session.refresh(enrollment)
    return enrollment


@router.get("/programs", response_model=PracticeProgramListResponse)
def list_programs(session: Session = Depends(get_session)) -> PracticeProgramListResponse:
    programs = session.exec(select(PracticeProgram)).all()
    return PracticeProgramListResponse(items=[_serialize_program(program) for program in programs])


@router.get("/programs/{program_id}", response_model=PracticeProgramResponse)
def get_program(program_id: UUID, session: Session = Depends(get_session)) -> PracticeProgramResponse:
    program = _get_program(session, program_id)
    return _serialize_program(program)


@router.post("/enroll", response_model=PracticeEnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll_program(
    payload: PracticeEnrollmentCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PracticeEnrollmentResponse:
    program = _get_program(session, payload.program_id)
    enrollment = _get_or_create_enrollment(session, current_user, program)
    return PracticeEnrollmentResponse.model_validate(enrollment)


@router.get("/enrollments", response_model=PracticeEnrollmentListResponse)
def list_enrollments(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PracticeEnrollmentListResponse:
    stmt = select(PracticeEnrollment).where(PracticeEnrollment.user_id == current_user.id)
    enrollments = session.exec(stmt).all()
    active_program_ids = {enrollment.program_id for enrollment in enrollments}
    programs: List[PracticeProgram] = []
    if active_program_ids:
        programs = session.exec(
            select(PracticeProgram).where(PracticeProgram.id.in_(active_program_ids))
        ).all()
    return PracticeEnrollmentListResponse(
        enrollments=[PracticeEnrollmentResponse.model_validate(e) for e in enrollments],
        active_programs=[_serialize_program(p) for p in programs],
    )


def _calculate_streak(enrollment: PracticeEnrollment, practiced_on: date) -> int:
    if enrollment.last_practiced_at:
        last_date = enrollment.last_practiced_at.date()
        delta = (practiced_on - last_date).days
        if delta == 1:
            return enrollment.streak_count + 1
        if delta == 0:
            return enrollment.streak_count
    return 1


@router.post("/programs/{program_id}/complete", response_model=PracticeCompletionResponse)
def complete_step(
    program_id: UUID,
    payload: PracticeCompletionRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> PracticeCompletionResponse:
    program = _get_program(session, program_id)
    step = _get_step(session, payload.step_id)
    if step.program_id != program.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Step does not belong to program")

    enrollment = _get_or_create_enrollment(session, current_user, program)

    practiced_at = payload.practiced_at or datetime.utcnow()
    timezone_name = _normalize_timezone(current_user)
    zone = ZoneInfo(timezone_name)
    practiced_local = practiced_at.astimezone(zone)
    practiced_on = practiced_local.date()

    new_streak = _calculate_streak(enrollment, practiced_on)
    enrollment.streak_count = new_streak
    enrollment.longest_streak = max(enrollment.longest_streak, new_streak)
    enrollment.last_practiced_at = practiced_at
    enrollment.total_completions += 1

    if step.order_index >= enrollment.current_step_index:
        enrollment.current_step_index = min(step.order_index + 1, program.duration_days + 1)
    if step.order_index == program.duration_days:
        enrollment.completed_at = practiced_at

    session_log = PracticeSessionLog(
        enrollment_id=enrollment.id,
        program_id=program.id,
        step_id=step.id,
        user_id=current_user.id,
        practiced_on=practiced_on,
        practiced_at=practiced_at,
        completed=True,
        minutes_practiced=payload.minutes_practiced,
        streak_after=new_streak,
        metadata_=payload.metadata_ or {},
    )

    session.add(session_log)
    session.add(enrollment)
    session.commit()
    session.refresh(enrollment)
    session.refresh(session_log)

    next_step_response = None
    if enrollment.current_step_index <= program.duration_days:
        stmt = select(PracticeStep).where(
            PracticeStep.program_id == program.id,
            PracticeStep.order_index == enrollment.current_step_index,
        )
        next_step_instance = session.exec(stmt).first()
        if next_step_instance:
            next_step_response = PracticeStepResponse.model_validate(next_step_instance)

    return PracticeCompletionResponse(
        enrollment=PracticeEnrollmentResponse.model_validate(enrollment),
        session_log=PracticeSessionLogResponse.model_validate(session_log),
        next_step=next_step_response,
    )
