from __future__ import annotations

from datetime import datetime, date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlmodel import Session
from zoneinfo import ZoneInfo

from app.core.dependencies import get_current_user
from app.db.database import get_session
from app.models.journal import JournalEntry
from app.models.user import User
from app.schemas.journal import (
    JournalEntryCreate,
    JournalEntryListResponse,
    JournalEntryResponse,
    JournalEntryUpdate,
    JournalFavoriteRequest,
    JournalTimelineDay,
    JournalTimelineResponse,
)

router = APIRouter(prefix="/journal", tags=["journal"])


def _normalize_timezone(timezone_name: Optional[str]) -> str:
    if timezone_name:
        try:
            ZoneInfo(timezone_name)
            return timezone_name
        except Exception:  # pragma: no cover - fallback handled below
            pass
    return "UTC"


def _get_sequence_for_day(session: Session, *, user_id: UUID, entry_date: date) -> int:
    stmt = select(func.max(JournalEntry.sequence_in_day)).where(
        JournalEntry.user_id == user_id,
        JournalEntry.local_date == entry_date,
        JournalEntry.archived_at.is_(None),
    )
    result = session.exec(stmt).one_or_none()
    return (result or 0) + 1


def _require_entry(session: Session, user: User, entry_id: UUID) -> JournalEntry:
    entry = session.get(JournalEntry, entry_id)
    if not entry or entry.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")
    return entry


@router.post("/entries", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
def create_journal_entry(
    payload: JournalEntryCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> JournalEntryResponse:
    now_utc = datetime.utcnow()
    timezone_name = _normalize_timezone(
        payload.local_timezone or (current_user.profile.timezone if current_user.profile else None)
    )
    zone = ZoneInfo(timezone_name)

    created_local_dt = datetime.now(zone)

    entry_date = payload.local_date or created_local_dt.date()
    sequence_in_day = _get_sequence_for_day(session, user_id=current_user.id, entry_date=entry_date)

    note_text = payload.note.strip()
    tags = sorted({tag.strip() for tag in payload.tags if tag.strip()}) if payload.tags else []

    entry = JournalEntry(
        user_id=current_user.id,
        prompt=payload.prompt,
        emoji=payload.emoji,
        note=note_text,
        tags=tags,
        mood=payload.mood,
        source=payload.source,
        is_favorite=bool(payload.is_favorite)
        if payload.is_favorite is not None
        else False,
        local_date=entry_date,
        local_timezone=timezone_name,
        created_local_at=created_local_dt.replace(tzinfo=None),
        sequence_in_day=sequence_in_day,
        sentiment_score=payload.sentiment_score,
        word_count=len(note_text.split()) if note_text else 0,
        weather_snapshot=payload.weather_snapshot or {},
        attachments=list(payload.attachments or []),
        metadata_=dict(payload.metadata_ or {}),
        created_from_device=payload.created_from_device,
        created_at=now_utc,
    )

    session.add(entry)
    session.commit()
    session.refresh(entry)
    return JournalEntryResponse.model_validate(entry)


@router.get("/entries", response_model=JournalEntryListResponse)
def list_journal_entries(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    mood: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    favorites_only: bool = Query(False, description="Filter only favorite entries"),
    include_archived: bool = Query(False),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None, description="ISO8601 timestamp cursor"),
) -> JournalEntryListResponse:
    stmt = (
        select(JournalEntry)
        .where(JournalEntry.user_id == current_user.id)
        .order_by(JournalEntry.created_at.desc(), JournalEntry.id.desc())
    )

    if not include_archived:
        stmt = stmt.where(JournalEntry.archived_at.is_(None))
    if start_date:
        stmt = stmt.where(JournalEntry.local_date >= start_date)
    if end_date:
        stmt = stmt.where(JournalEntry.local_date <= end_date)
    if mood:
        stmt = stmt.where(JournalEntry.mood == mood)
    if tag:
        stmt = stmt.where(JournalEntry.tags.contains([tag]))
    if favorites_only:
        stmt = stmt.where(JournalEntry.is_favorite.is_(True))
    if cursor:
        try:
            cursor_dt = datetime.fromisoformat(cursor)
            stmt = stmt.where(JournalEntry.created_at < cursor_dt)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cursor format")

    entries = session.exec(stmt.limit(limit + 1)).all()
    next_cursor = None
    if len(entries) > limit:
        next_cursor = entries[limit].created_at.isoformat() if entries[limit].created_at else None
        entries = entries[:limit]

    return JournalEntryListResponse(
        items=[JournalEntryResponse.model_validate(entry) for entry in entries],
        next_cursor=next_cursor,
    )


@router.get("/entries/{entry_id}", response_model=JournalEntryResponse)
def get_journal_entry(
    entry_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> JournalEntryResponse:
    entry = _require_entry(session, current_user, entry_id)
    return JournalEntryResponse.model_validate(entry)


@router.put("/entries/{entry_id}", response_model=JournalEntryResponse)
def update_journal_entry(
    entry_id: UUID,
    payload: JournalEntryUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> JournalEntryResponse:
    entry = _require_entry(session, current_user, entry_id)

    timezone_name = _normalize_timezone(
        payload.local_timezone
        or entry.local_timezone
        or (current_user.profile.timezone if current_user.profile else None)
    )

    if payload.prompt is not None:
        entry.prompt = payload.prompt
    if payload.emoji is not None:
        entry.emoji = payload.emoji
    if payload.note is not None:
        note = payload.note.strip()
        entry.note = note
        entry.word_count = len(note.split()) if note else 0
    if payload.tags is not None:
        entry.tags = sorted({tag.strip() for tag in payload.tags if tag.strip()})
    if payload.mood is not None:
        entry.mood = payload.mood
    if payload.source is not None:
        entry.source = payload.source
    if payload.is_favorite is not None:
        entry.is_favorite = payload.is_favorite
    if payload.sentiment_score is not None:
        entry.sentiment_score = payload.sentiment_score
    if payload.weather_snapshot is not None:
        entry.weather_snapshot = payload.weather_snapshot
    if payload.attachments is not None:
        entry.attachments = payload.attachments
    if payload.metadata_ is not None:
        entry.metadata_ = dict(payload.metadata_)
    if payload.created_from_device is not None:
        entry.created_from_device = payload.created_from_device

    if payload.local_timezone is not None:
        entry.local_timezone = timezone_name

    if payload.local_date is not None and payload.local_date != entry.local_date:
        entry.local_date = payload.local_date
        entry.sequence_in_day = _get_sequence_for_day(
            session, user_id=current_user.id, entry_date=payload.local_date
        )

    zone = ZoneInfo(entry.local_timezone)
    if entry.created_local_at is None:
        entry.created_local_at = datetime.now(zone).replace(tzinfo=None)
    entry.updated_local_at = datetime.now(zone).replace(tzinfo=None)

    zone = ZoneInfo(entry.local_timezone)
    entry.updated_at = datetime.utcnow()
    entry.updated_local_at = datetime.now(zone).replace(tzinfo=None)

    entry.updated_at = datetime.utcnow()
    if payload.archived_at is not None:
        entry.archived_at = payload.archived_at

    session.add(entry)
    session.commit()
    session.refresh(entry)
    return JournalEntryResponse.model_validate(entry)


@router.delete(
    "/entries/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_journal_entry(
    entry_id: UUID,
    hard_delete: bool = Query(False, description="Permanently delete the entry"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Response:
    entry = _require_entry(session, current_user, entry_id)
    if hard_delete:
        session.delete(entry)
    else:
        entry.archived_at = datetime.utcnow()
        entry.updated_at = datetime.utcnow()
        session.add(entry)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/entries/{entry_id}/favorite", response_model=JournalEntryResponse)
def set_favorite_status(
    entry_id: UUID,
    payload: JournalFavoriteRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> JournalEntryResponse:
    entry = _require_entry(session, current_user, entry_id)
    entry.is_favorite = payload.is_favorite
    entry.updated_at = datetime.utcnow()
    entry.updated_local_at = datetime.now(ZoneInfo(entry.local_timezone)).replace(tzinfo=None)
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return JournalEntryResponse.model_validate(entry)


@router.get("/entries/timeline", response_model=JournalTimelineResponse)
def get_journal_timeline(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    include_archived: bool = Query(False),
    limit_days: int = Query(60, ge=1, le=365),
) -> JournalTimelineResponse:
    stmt = select(JournalEntry).where(JournalEntry.user_id == current_user.id)
    if not include_archived:
        stmt = stmt.where(JournalEntry.archived_at.is_(None))
    if start_date:
        stmt = stmt.where(JournalEntry.local_date >= start_date)
    if end_date:
        stmt = stmt.where(JournalEntry.local_date <= end_date)

    stmt = stmt.order_by(JournalEntry.local_date.desc(), JournalEntry.created_at.desc())
    entries = session.exec(stmt).all()

    timeline: dict[date, JournalTimelineDay] = {}
    total_entries = 0
    favorite_entries = 0
    first_entry_at: Optional[datetime] = None
    latest_entry_at: Optional[datetime] = None

    for entry in entries:
        if len(timeline) >= limit_days and entry.local_date not in timeline:
            continue

        bucket = timeline.get(entry.local_date)
        if not bucket:
            bucket = JournalTimelineDay(
                local_date=entry.local_date,
                entry_count=0,
                favorite_count=0,
                moods={},
                tags={},
                last_entry_at=None,
            )
            timeline[entry.local_date] = bucket

        bucket.entry_count += 1
        total_entries += 1
        bucket.last_entry_at = bucket.last_entry_at or entry.created_at

        if entry.is_favorite:
            bucket.favorite_count += 1
            favorite_entries += 1
        if entry.mood:
            bucket.moods[entry.mood] = bucket.moods.get(entry.mood, 0) + 1
        for tag in entry.tags or []:
            bucket.tags[tag] = bucket.tags.get(tag, 0) + 1

        if latest_entry_at is None or (entry.created_at and entry.created_at > latest_entry_at):
            latest_entry_at = entry.created_at
        if first_entry_at is None or (entry.created_at and entry.created_at < first_entry_at):
            first_entry_at = entry.created_at

    days = sorted(timeline.values(), key=lambda b: b.local_date, reverse=True)

    return JournalTimelineResponse(
        days=days,
        total_entries=total_entries,
        favorite_entries=favorite_entries,
        first_entry_at=first_entry_at,
        latest_entry_at=latest_entry_at,
    )
