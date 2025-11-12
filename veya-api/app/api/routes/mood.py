from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db.database import get_session
from app.models.user import User
from app.models.mood import MoodEntry
from app.schemas.mood import MoodEntryLog, MoodEntryResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/mood", tags=["mood"])


@router.post("/log", response_model=MoodEntryResponse)
def log_mood(
    mood_data: MoodEntryLog,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Log a mood entry for the current user."""
    # Validate mood_value
    valid_moods = ["great", "good", "neutral", "bad", "terrible"]
    if mood_data.mood_value not in valid_moods:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid mood_value. Must be one of: {', '.join(valid_moods)}"
        )
    
    mood_entry = MoodEntry(
        user_id=current_user.id,
        mood_value=mood_data.mood_value,
        note=mood_data.note,
    )
    
    session.add(mood_entry)
    session.commit()
    session.refresh(mood_entry)
    
    return mood_entry

