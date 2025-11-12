from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.database import get_session
from app.models.user import User
from app.models.session import ProgressSession
from app.schemas.session import ProgressSessionSync, ProgressSessionResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/progress", tags=["progress"])


@router.post("/sync", response_model=ProgressSessionResponse)
def sync_progress(
    progress_data: ProgressSessionSync,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Sync progress data (streak + minutes) for the current user."""
    progress_session = ProgressSession(
        user_id=current_user.id,
        streak=progress_data.streak,
        minutes=progress_data.minutes,
        session_date=progress_data.session_date or None,
    )
    
    session.add(progress_session)
    session.commit()
    session.refresh(progress_session)
    
    return progress_session

