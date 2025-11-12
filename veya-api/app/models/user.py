from datetime import datetime
from typing import Optional, List, Dict, Any, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from uuid import uuid4, UUID
from enum import Enum

if TYPE_CHECKING:  # pragma: no cover
    from app.models.user_metrics import UserMetrics
    from app.models.journal import JournalEntry
    from app.models.practice import PracticeEnrollment


class AuthProvider(str, Enum):
    """Authentication provider types."""
    GUEST = "guest"
    EMAIL = "email"
    GOOGLE = "google"
    APPLE = "apple"
    FIREBASE = "firebase"


class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    
    # Firebase Authentication
    firebase_uid: Optional[str] = Field(default=None, unique=True, index=True)
    
    # Basic Info
    email: Optional[str] = Field(default=None, unique=True, index=True)
    email_verified: bool = Field(default=False)
    username: Optional[str] = Field(default=None, unique=True, index=True)
    
    # Authentication
    is_guest: bool = Field(default=True)
    auth_provider: AuthProvider = Field(default=AuthProvider.GUEST)
    password_hash: Optional[str] = Field(default=None)  # For email/password auth
    
    # Profile
    firstname: Optional[str] = Field(default=None)
    lastname: Optional[str] = Field(default=None)
    nickname: Optional[str] = Field(default=None)
    display_name: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    avatar_r2_key: Optional[str] = Field(default=None, index=True)
    avatar_uploaded_at: Optional[datetime] = Field(default=None)
    
    # Status
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    last_login_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    profile: Optional["UserProfile"] = Relationship(back_populates="user", sa_relationship_kwargs={"uselist": False})
    social_accounts: List["SocialAccount"] = Relationship(back_populates="user")
    sessions: List["ProgressSession"] = Relationship(back_populates="user")
    moods: List["MoodEntry"] = Relationship(back_populates="user")
    metrics: Optional["UserMetrics"] = Relationship(back_populates="user", sa_relationship_kwargs={"uselist": False})
    journal_entries: List["JournalEntry"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    practice_enrollments: List["PracticeEnrollment"] = Relationship(back_populates="user")


class SocialAccount(SQLModel, table=True):
    """Linked social accounts (Google, Apple, etc.)"""
    __tablename__ = "social_accounts"
    
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    
    # Provider Info
    provider: AuthProvider = Field(index=True)  # google, apple, etc.
    provider_account_id: str = Field(index=True)  # Unique ID from provider
    provider_email: Optional[str] = Field(default=None)
    
    # Provider-specific data
    access_token: Optional[str] = Field(default=None)  # Encrypted in production
    refresh_token: Optional[str] = Field(default=None)  # Encrypted in production
    expires_at: Optional[datetime] = Field(default=None)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    user: User = Relationship(back_populates="social_accounts")


class UserProfile(SQLModel, table=True):
    """Extended user profile with flexible personalization data."""
    __tablename__ = "user_profiles"
    
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", unique=True, index=True)
    
    # Flexible JSONB payload storing answers keyed by field_key/screen identifiers
    personalization_data: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSON)
    )
    timezone: str = Field(default="UTC")
    
    # Onboarding tracking
    onboarding_screen: Optional[str] = Field(default=None)  # Current onboarding screen: "welcome", "breathe", "personalize", "completed"
    onboarding_started_at: Optional[datetime] = Field(default=None)  # When user started onboarding
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    personalized_at: Optional[datetime] = Field(default=None)  # When onboarding completed
    
    # Relationships
    user: User = Relationship(back_populates="profile")
    
    # --- Personalization helpers -------------------------------------------------
    _LIST_FIELDS = {
        "goals",
        "challenges",
        "practice_preferences",
        "interests",
        "reminder_times",
    }
    _BOOL_FIELDS = {"data_consent", "marketing_consent"}
    
    def _get_personalization_value(self, key: str, default: Any = None) -> Any:
        data = self.personalization_data or {}
        return data.get(key, default)
    
    def _set_personalization_value(self, key: str, value: Any) -> None:
        data = dict(self.personalization_data or {})
        if value is None:
            data.pop(key, None)
        else:
            data[key] = value
        self.personalization_data = data
    
    def update_personalization(self, updates: Dict[str, Any]) -> None:
        """Bulk update personalization data with normalization."""
        if not updates:
            return
        data = dict(self.personalization_data or {})
        for key, value in updates.items():
            if key in self._LIST_FIELDS:
                if value is None:
                    data.pop(key, None)
                elif isinstance(value, (list, tuple, set)):
                    data[key] = list(value)
                else:
                    data[key] = [value]
            elif key in self._BOOL_FIELDS:
                if value is None:
                    data.pop(key, None)
                else:
                    data[key] = bool(value)
            else:
                if value is None:
                    data.pop(key, None)
                else:
                    data[key] = value
        self.personalization_data = data
    
    def _get_list_field(self, key: str) -> List[str]:
        value = self._get_personalization_value(key, [])
        if isinstance(value, list):
            return value
        if isinstance(value, (tuple, set)):
            return list(value)
        if value is None:
            return []
        return [value]
    
    def _set_list_field(self, key: str, value: Optional[List[str]]) -> None:
        if value is None:
            self._set_personalization_value(key, [])
        elif isinstance(value, (list, tuple, set)):
            self._set_personalization_value(key, list(value))
        else:
            self._set_personalization_value(key, [value])
    
    def _get_string_field(self, key: str) -> Optional[str]:
        value = self._get_personalization_value(key)
        if isinstance(value, str):
            cleaned = value.strip()
            return cleaned or None
        return None
    
    def _set_string_field(self, key: str, value: Optional[str]) -> None:
        if isinstance(value, str):
            cleaned = value.strip()
            self._set_personalization_value(key, cleaned or None)
        else:
            self._set_personalization_value(key, value)
    
    def _get_bool_field(self, key: str) -> bool:
        value = self._get_personalization_value(key)
        return bool(value) if value is not None else False
    
    def _set_bool_field(self, key: str, value: Optional[bool]) -> None:
        if value is None:
            data = dict(self.personalization_data or {})
            data.pop(key, None)
            self.personalization_data = data
        else:
            self._set_personalization_value(key, bool(value))
    
    # --- Dynamic properties for backward compatibility ---------------------------
    @property
    def name(self) -> Optional[str]:
        return self._get_string_field("name")
    
    @name.setter
    def name(self, value: Optional[str]) -> None:
        self._set_string_field("name", value)
    
    @property
    def age_range(self) -> Optional[str]:
        return self._get_string_field("age_range")
    
    @age_range.setter
    def age_range(self, value: Optional[str]) -> None:
        self._set_string_field("age_range", value)
    
    @property
    def gender(self) -> Optional[str]:
        return self._get_string_field("gender")
    
    @gender.setter
    def gender(self, value: Optional[str]) -> None:
        self._set_string_field("gender", value)
    
    @property
    def occupation(self) -> Optional[str]:
        return self._get_string_field("occupation")
    
    @occupation.setter
    def occupation(self, value: Optional[str]) -> None:
        self._set_string_field("occupation", value)
    
    @property
    def wake_time(self) -> Optional[str]:
        return self._get_string_field("wake_time")
    
    @wake_time.setter
    def wake_time(self, value: Optional[str]) -> None:
        self._set_string_field("wake_time", value)
    
    @property
    def sleep_time(self) -> Optional[str]:
        return self._get_string_field("sleep_time")
    
    @sleep_time.setter
    def sleep_time(self, value: Optional[str]) -> None:
        self._set_string_field("sleep_time", value)
    
    @property
    def work_hours(self) -> Optional[str]:
        return self._get_string_field("work_hours")
    
    @work_hours.setter
    def work_hours(self, value: Optional[str]) -> None:
        self._set_string_field("work_hours", value)
    
    @property
    def screen_time(self) -> Optional[str]:
        return self._get_string_field("screen_time")
    
    @screen_time.setter
    def screen_time(self, value: Optional[str]) -> None:
        self._set_string_field("screen_time", value)
    
    @property
    def goals(self) -> List[str]:
        return self._get_list_field("goals")
    
    @goals.setter
    def goals(self, value: Optional[List[str]]) -> None:
        self._set_list_field("goals", value)
    
    @property
    def challenges(self) -> List[str]:
        return self._get_list_field("challenges")
    
    @challenges.setter
    def challenges(self, value: Optional[List[str]]) -> None:
        self._set_list_field("challenges", value)
    
    @property
    def practice_preferences(self) -> List[str]:
        return self._get_list_field("practice_preferences")
    
    @practice_preferences.setter
    def practice_preferences(self, value: Optional[List[str]]) -> None:
        self._set_list_field("practice_preferences", value)
    
    @property
    def interests(self) -> List[str]:
        return self._get_list_field("interests")
    
    @interests.setter
    def interests(self, value: Optional[List[str]]) -> None:
        self._set_list_field("interests", value)
    
    @property
    def reminder_times(self) -> List[str]:
        return self._get_list_field("reminder_times")
    
    @reminder_times.setter
    def reminder_times(self, value: Optional[List[str]]) -> None:
        self._set_list_field("reminder_times", value)
    
    @property
    def experience_level(self) -> Optional[str]:
        return self._get_string_field("experience_level")
    
    @experience_level.setter
    def experience_level(self, value: Optional[str]) -> None:
        self._set_string_field("experience_level", value)
    
    @property
    def mood_tendency(self) -> Optional[str]:
        return self._get_string_field("mood_tendency")
    
    @mood_tendency.setter
    def mood_tendency(self, value: Optional[str]) -> None:
        self._set_string_field("mood_tendency", value)
    
    @property
    def preferred_practice_time(self) -> Optional[str]:
        return self._get_string_field("preferred_practice_time")
    
    @preferred_practice_time.setter
    def preferred_practice_time(self, value: Optional[str]) -> None:
        self._set_string_field("preferred_practice_time", value)
    
    @property
    def data_consent(self) -> bool:
        return self._get_bool_field("data_consent")
    
    @data_consent.setter
    def data_consent(self, value: Optional[bool]) -> None:
        self._set_bool_field("data_consent", value)
    
    @property
    def marketing_consent(self) -> bool:
        return self._get_bool_field("marketing_consent")
    
    @marketing_consent.setter
    def marketing_consent(self, value: Optional[bool]) -> None:
        self._set_bool_field("marketing_consent", value)
