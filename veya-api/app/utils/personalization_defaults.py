"""
Default personalization template data.
This file contains the default options that should be seeded into the database.
Templates are stored as JSONB in a single table per category.
"""
from typing import Dict, List, Any

# Screen metadata for onboarding flow (matches Personalize.tsx PAGES array)
# Order: 1=basic, 2=lifestyle, 3=goals, 4=challenges, 5=practice, 6=experience, 7=mood, 8=time, 9=reminders, 10=interests
SCREEN_METADATA = {
    "basic": {
        "view_order": 1,
        "screen_key": "basic",
        "screen_title": "Personalize Your Journey",
        "screen_subtitle": "Tell us a bit about you",
        "screen_type": "form",
        "screen_icon": "👤",
    },
    "lifestyle": {
        "view_order": 2,
        "screen_key": "lifestyle",
        "screen_title": "Lifestyle & Routine",
        "screen_subtitle": "This helps us schedule sessions at the right times",
        "screen_type": "form",
        "screen_icon": "⏰",
    },
    "goals": {
        "view_order": 3,
        "screen_key": "goals",
        "screen_title": "Personalize Your Journey",
        "screen_subtitle": "What brings you here today?",
        "screen_type": "multi",
        "screen_icon": "🎯",
    },
    "challenges": {
        "view_order": 4,
        "screen_key": "challenges",
        "screen_title": "Personalize Your Journey",
        "screen_subtitle": "Which challenges do you face most often?",
        "screen_type": "multi",
        "screen_icon": "💪",
    },
    "practices": {
        "view_order": 5,
        "screen_key": "practice",
        "screen_title": "Personalize Your Journey",
        "screen_subtitle": "What type of practice do you enjoy?",
        "screen_type": "multi",
        "screen_icon": "🧘",
    },
    "experience_levels": {
        "view_order": 6,
        "screen_key": "experience",
        "screen_title": "Experience Level",
        "screen_subtitle": "We will tailor difficulty and guidance tone",
        "screen_type": "single",
        "screen_icon": "📚",
    },
    "mood_tendencies": {
        "view_order": 7,
        "screen_key": "mood",
        "screen_title": "Mood Tendencies",
        "screen_subtitle": "Pick the one that fits you most often",
        "screen_type": "single",
        "screen_icon": "😊",
    },
    "practice_times": {
        "view_order": 8,
        "screen_key": "time",
        "screen_title": "Personalize Your Journey",
        "screen_subtitle": "When do you prefer to practice?",
        "screen_type": "single",
        "screen_icon": "🌅",
    },
    "reminders": {
        "view_order": 9,
        "screen_key": "reminders",
        "screen_title": "Notifications & Reminders",
        "screen_subtitle": "Choose when you want gentle nudges",
        "screen_type": "multi",
        "screen_icon": "🔔",
    },
    "interests": {
        "view_order": 10,
        "screen_key": "interests",
        "screen_title": "Optional Deep Interests",
        "screen_subtitle": "This curates your articles and learning feed",
        "screen_type": "multi",
        "screen_icon": "📖",
    },
    "consent": {
        "view_order": 11,
        "screen_key": "consent",
        "screen_title": "Data Privacy & Consent",
        "screen_subtitle": "Your wellness journey, your data",
        "screen_type": "consent",
        "screen_icon": "🔒",
    },
}

# Template structure: Each template is a dict with code, label, emoji, display_order, is_active
def get_default_templates() -> Dict[str, List[Dict[str, Any]]]:
    """
    Get all default templates organized by category.
    Returns:
        Dictionary with category keys and list of template objects
    """
    return {
        # Basic info (form fields - no templates, but metadata entry)
        "basic": [],
        # Lifestyle (form fields - no templates, but metadata entry)
        "lifestyle": [],
        "goals": [
            {"code": "reduce_stress", "label": "Reduce stress", "emoji": "🌿", "display_order": 1, "is_active": True},
            {"code": "sleep_better", "label": "Sleep better", "emoji": "😴", "display_order": 2, "is_active": True},
            {"code": "improve_focus", "label": "Improve focus", "emoji": "🎯", "display_order": 3, "is_active": True},
            {"code": "manage_emotions", "label": "Manage emotions", "emoji": "💞", "display_order": 4, "is_active": True},
        ],
        "challenges": [
            {"code": "overthinking", "label": "Overthinking", "emoji": "🤯", "display_order": 1, "is_active": True},
            {"code": "burnout", "label": "Burnout", "emoji": "🔥", "display_order": 2, "is_active": True},
            {"code": "fatigue", "label": "Fatigue", "emoji": "🥱", "display_order": 3, "is_active": True},
            {"code": "insomnia", "label": "Insomnia", "emoji": "🌙", "display_order": 4, "is_active": True},
            {"code": "low_motivation", "label": "Low motivation", "emoji": "🪫", "display_order": 5, "is_active": True},
            {"code": "loneliness", "label": "Loneliness", "emoji": "🫥", "display_order": 6, "is_active": True},
            {"code": "relationship_stress", "label": "Relationship stress", "emoji": "💔", "display_order": 7, "is_active": True},
            {"code": "anxiety", "label": "Anxiety", "emoji": "😟", "display_order": 8, "is_active": True},
        ],
        "practices": [
            {"code": "breathing", "label": "Breathing", "emoji": "🫁", "display_order": 1, "is_active": True},
            {"code": "guided_meditation", "label": "Guided meditation", "emoji": "🧘", "display_order": 2, "is_active": True},
            {"code": "soundscape", "label": "Soundscape", "emoji": "🌧️", "display_order": 3, "is_active": True},
            {"code": "short_reflections", "label": "Short reflections", "emoji": "📝", "display_order": 4, "is_active": True},
            {"code": "mindful_journaling", "label": "Mindful journaling", "emoji": "📓", "display_order": 5, "is_active": True},
        ],
        # Practice time preferences (for preferred_practice_time field)
        "practice_times": [
            {"code": "morning", "label": "Morning", "emoji": "🌅", "display_order": 1, "is_active": True},
            {"code": "afternoon", "label": "Afternoon", "emoji": "🌤️", "display_order": 2, "is_active": True},
            {"code": "night", "label": "Night", "emoji": "🌃", "display_order": 3, "is_active": True},
        ],
        # Mood tendencies (for mood_tendency field)
        "mood_tendencies": [
            {"code": "calm", "label": "Calm", "emoji": "😌", "display_order": 1, "is_active": True},
            {"code": "stressed", "label": "Stressed", "emoji": "😣", "display_order": 2, "is_active": True},
            {"code": "sad", "label": "Sad", "emoji": "😞", "display_order": 3, "is_active": True},
            {"code": "happy", "label": "Happy", "emoji": "😊", "display_order": 4, "is_active": True},
        ],
        # Experience levels (for experience_level field)
        "experience_levels": [
            {"code": "beginner", "label": "Beginner", "emoji": "🌱", "display_order": 1, "is_active": True},
            {"code": "intermediate", "label": "Intermediate", "emoji": "🌿", "display_order": 2, "is_active": True},
            {"code": "advanced", "label": "Advanced", "emoji": "🌳", "display_order": 3, "is_active": True},
        ],
        "interests": [
            {"code": "mindfulness", "label": "Mindfulness", "emoji": "🧠", "display_order": 1, "is_active": True},
            {"code": "sleep_science", "label": "Sleep science", "emoji": "🛌", "display_order": 2, "is_active": True},
            {"code": "productivity", "label": "Productivity", "emoji": "⚡", "display_order": 3, "is_active": True},
            {"code": "relationships", "label": "Relationships", "emoji": "💞", "display_order": 4, "is_active": True},
            {"code": "self_compassion", "label": "Self-compassion", "emoji": "💗", "display_order": 5, "is_active": True},
        ],
        "reminders": [
            {"code": "morning", "label": "Morning check-in", "emoji": "🌞", "display_order": 1, "is_active": True},
            {"code": "midday", "label": "Midday break", "emoji": "🌤️", "display_order": 2, "is_active": True},
            {"code": "evening", "label": "Evening reflection", "emoji": "🌙", "display_order": 3, "is_active": True},
        ],
        # Consent screen (no templates, just metadata and fields)
        "consent": [],
    }


# Static options (not templates, but enum-like values)
# These are fixed and don't need templates
DEFAULT_AGE_RANGES = [
    "13-17", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"
]

DEFAULT_GENDERS = [
    "male", "female", "non_binary", "prefer_not_say"
]

DEFAULT_WORK_HOURS = [
    "under_4", "4_6", "6_8", "8_10", "10_12", "over_12"
]

DEFAULT_SCREEN_TIME = [
    "under_2", "2_4", "4_6", "6_8", "8_10", "over_10"
]

DEFAULT_EXPERIENCE_LEVELS = [
    "beginner", "intermediate", "advanced"
]

DEFAULT_MOOD_TENDENCIES = [
    "calm", "stressed", "sad", "happy"
]

DEFAULT_PRACTICE_TIMES = [
    "morning", "afternoon", "night"
]


def get_default_fields() -> Dict[str, List[Dict[str, Any]]]:
    """
    Get default field definitions for form screens.
    Returns:
        Dictionary with category keys and list of field definitions
    """
    return {
        "basic": [
            {
                "field_key": "name",
                "field_type": "text",
                "type": "text",  # Frontend compatibility
                "label": "Name",
                "placeholder": "Enter your name",
                "data_type": "string",
                "required": True,
                "optional": False,
                "validation": {
                    "min_length": 1,
                    "max_length": 100
                },
                "keyboard_type": "default"
            },
            {
                "field_key": "age_range",
                "field_type": "dropdown",
                "type": "dropdown",  # Frontend compatibility
                "label": "Age range",
                "placeholder": "Select age range",
                "data_type": "string",
                "required": True,
                "optional": False,
                "options_source": "static",
                "options": [
                    {"code": "13-17", "label": "13-17", "id": "13-17"},  # Add id for frontend compatibility
                    {"code": "18-24", "label": "18-24", "id": "18-24"},
                    {"code": "25-34", "label": "25-34", "id": "25-34"},
                    {"code": "35-44", "label": "35-44", "id": "35-44"},
                    {"code": "45-54", "label": "45-54", "id": "45-54"},
                    {"code": "55-64", "label": "55-64", "id": "55-64"},
                    {"code": "65+", "label": "65+", "id": "65+"}
                ]
            },
            {
                "field_key": "gender",
                "field_type": "dropdown",
                "type": "dropdown",  # Frontend compatibility
                "label": "Gender",
                "placeholder": "Select gender",
                "data_type": "string",
                "required": False,
                "optional": True,
                "options_source": "static",
                "options": [
                    {"code": "male", "label": "Male", "id": "male"},
                    {"code": "female", "label": "Female", "id": "female"},
                    {"code": "non_binary", "label": "Non-binary", "id": "non_binary"},
                    {"code": "prefer_not_say", "label": "Prefer not to say", "id": "prefer_not_say"}
                ]
            },
            {
                "field_key": "occupation",
                "field_type": "text",
                "type": "text",  # Frontend compatibility
                "label": "Occupation",
                "placeholder": "Enter your occupation",
                "data_type": "string",
                "required": False,
                "optional": True,
                "validation": {
                    "max_length": 100
                },
                "keyboard_type": "default"
            }
        ],
        "lifestyle": [
            {
                "field_key": "wake_time",
                "field_type": "time",
                "type": "time",  # Frontend compatibility
                "label": "Wake-up time",
                "placeholder": "Select time",
                "data_type": "string",
                "required": True,
                "optional": False,
                "format": "HH:mm",
                "allow_range": False,
                "default_value": "07:00",
                "time_picker_config": {
                    "minute_interval": 5,
                    "show_seconds": False
                }
            },
            {
                "field_key": "sleep_time",
                "field_type": "time_range",
                "type": "time",  # Frontend compatibility (time_range also uses TimePicker)
                "label": "Sleep time",
                "placeholder": "Select time range",
                "data_type": "string",
                "required": True,
                "optional": False,
                "format": "HH:mm - HH:mm",
                "allow_range": True,
                "time_picker_config": {
                    "minute_interval": 5,
                    "allow_single": True
                }
            },
            {
                "field_key": "work_hours",
                "field_type": "dropdown",
                "type": "dropdown",  # Frontend compatibility
                "label": "Average daily work hours",
                "placeholder": "Select work hours",
                "data_type": "string",
                "required": True,
                "optional": False,
                "options_source": "static",
                "options": [
                    {"code": "under_4", "label": "Under 4 hours", "id": "under_4"},
                    {"code": "4_6", "label": "4-6 hours", "id": "4_6"},
                    {"code": "6_8", "label": "6-8 hours", "id": "6_8"},
                    {"code": "8_10", "label": "8-10 hours", "id": "8_10"},
                    {"code": "10_12", "label": "10-12 hours", "id": "10_12"},
                    {"code": "over_12", "label": "Over 12 hours", "id": "over_12"}
                ]
            },
            {
                "field_key": "screen_time",
                "field_type": "dropdown",
                "type": "dropdown",  # Frontend compatibility
                "label": "Daily screen time",
                "placeholder": "Select screen time",
                "data_type": "string",
                "required": True,
                "optional": False,
                "options_source": "static",
                "options": [
                    {"code": "under_2", "label": "Under 2 hours", "id": "under_2"},
                    {"code": "2_4", "label": "2-4 hours", "id": "2_4"},
                    {"code": "4_6", "label": "4-6 hours", "id": "4_6"},
                    {"code": "6_8", "label": "6-8 hours", "id": "6_8"},
                    {"code": "8_10", "label": "8-10 hours", "id": "8_10"},
                    {"code": "over_10", "label": "Over 10 hours", "id": "over_10"}
                ]
            }
        ],
        "consent": [
            {
                "field_key": "data_consent",
                "field_type": "switch",
                "type": "switch",  # Frontend compatibility
                "label": "I agree to use my wellness data for personalized insights",
                "data_type": "boolean",
                "required": True,
                "optional": False,
                "default_value": False,
                "consent_text": "We use your wellness data to personalize your experience—recommending sessions, articles, and reminders that fit your goals and challenges. Your data stays secure and is never shared with third parties. You can update your preferences anytime in settings."
            }
        ],
        "goals": [
            {
                "field_key": "goals",
                "field_type": "multi_select",
                "label": "Select your goals",
                "data_type": "array",
                "required": True,
                "optional": False,
                "min_selections": 1,
                "max_selections": None,
                "templates_category": "goals",
                "display_style": "grid"
            }
        ],
        "challenges": [
            {
                "field_key": "challenges",
                "field_type": "multi_select",
                "label": "Select your challenges",
                "data_type": "array",
                "required": True,
                "optional": False,
                "min_selections": 1,
                "max_selections": None,
                "templates_category": "challenges",
                "display_style": "grid"
            }
        ],
        "practice": [
            {
                "field_key": "practice_preferences",
                "field_type": "multi_select",
                "label": "Select practice preferences",
                "data_type": "array",
                "required": True,
                "optional": False,
                "min_selections": 1,
                "max_selections": None,
                "templates_category": "practices",
                "display_style": "grid"
            }
        ],
        "experience": [
            {
                "field_key": "experience_level",
                "field_type": "single_select",
                "label": "Select experience level",
                "data_type": "string",
                "required": True,
                "optional": False,
                "templates_category": "experience_levels",
                "display_style": "grid"
            }
        ],
        "mood": [
            {
                "field_key": "mood_tendency",
                "field_type": "single_select",
                "label": "Select mood tendency",
                "data_type": "string",
                "required": True,
                "optional": False,
                "templates_category": "mood_tendencies",
                "display_style": "grid"
            }
        ],
        "time": [
            {
                "field_key": "preferred_practice_time",
                "field_type": "single_select",
                "label": "Select preferred practice time",
                "data_type": "string",
                "required": True,
                "optional": False,
                "templates_category": "practice_times",
                "display_style": "grid"
            }
        ],
        "reminders": [
            {
                "field_key": "reminders",
                "field_type": "multi_select",
                "label": "Select reminder times",
                "data_type": "array",
                "required": True,
                "optional": False,
                "min_selections": 1,
                "max_selections": None,
                "templates_category": "reminders",
                "display_style": "grid"
            }
        ],
        "interests": [
            {
                "field_key": "interests",
                "field_type": "multi_select",
                "label": "Select interests",
                "data_type": "array",
                "required": False,
                "optional": True,
                "min_selections": 0,
                "max_selections": None,
                "templates_category": "interests",
                "display_style": "grid"
            }
        ]
    }


def get_all_defaults() -> Dict[str, List]:
    """
    Get all default options including static lists.
    Returns:
        Dictionary with all default values
    """
    templates = get_default_templates()
    return {
        **templates,
        "age_ranges": DEFAULT_AGE_RANGES,
        "genders": DEFAULT_GENDERS,
        "work_hours": DEFAULT_WORK_HOURS,
        "screen_time": DEFAULT_SCREEN_TIME,
        "experience_levels": DEFAULT_EXPERIENCE_LEVELS,
        "mood_tendencies": DEFAULT_MOOD_TENDENCIES,
        "practice_times": DEFAULT_PRACTICE_TIMES,
    }
