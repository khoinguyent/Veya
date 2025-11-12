from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/catalog", tags=["catalog"])


class SessionItem(BaseModel):
    id: str
    title: str
    description: str
    duration_minutes: int
    category: str


@router.get("/sessions", response_model=List[SessionItem])
def get_sessions():
    """Get a static list of meditation sessions."""
    return [
        {
            "id": "1",
            "title": "Morning Calm",
            "description": "Start your day with peace and clarity",
            "duration_minutes": 10,
            "category": "meditation",
        },
        {
            "id": "2",
            "title": "Deep Sleep",
            "description": "Relax your mind for a restful night",
            "duration_minutes": 20,
            "category": "sleep",
        },
        {
            "id": "3",
            "title": "Breathing Exercise",
            "description": "Focus on your breath and find inner calm",
            "duration_minutes": 5,
            "category": "breathing",
        },
        {
            "id": "4",
            "title": "Stress Relief",
            "description": "Release tension and anxiety",
            "duration_minutes": 15,
            "category": "meditation",
        },
        {
            "id": "5",
            "title": "Body Scan",
            "description": "Mindful awareness of your physical sensations",
            "duration_minutes": 25,
            "category": "meditation",
        },
    ]

