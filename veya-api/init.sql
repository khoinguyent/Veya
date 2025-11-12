-- ============================================================================
-- Veya API Database Initialization Script
-- ============================================================================
-- This script initializes the database with default personalization templates
-- based on the onboarding screens in the frontend application.
--
-- Usage:
--   psql -U postgres -d veya -f init.sql
--   Or via Docker:
--   docker-compose exec db psql -U postgres -d veya -f /docker-entrypoint-initdb.d/init.sql
--
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Add view_order and screen metadata columns (if they don't exist)
-- ============================================================================

-- Add view_order column
ALTER TABLE personalization_templates 
ADD COLUMN IF NOT EXISTS view_order INTEGER DEFAULT 0;

-- Add screen metadata columns
ALTER TABLE personalization_templates 
ADD COLUMN IF NOT EXISTS screen_key VARCHAR;

ALTER TABLE personalization_templates 
ADD COLUMN IF NOT EXISTS screen_title VARCHAR;

ALTER TABLE personalization_templates 
ADD COLUMN IF NOT EXISTS screen_subtitle VARCHAR;

ALTER TABLE personalization_templates 
ADD COLUMN IF NOT EXISTS screen_type VARCHAR;

ALTER TABLE personalization_templates 
ADD COLUMN IF NOT EXISTS screen_icon VARCHAR;

-- Create index on view_order for faster sorting
CREATE INDEX IF NOT EXISTS idx_personalization_templates_view_order 
ON personalization_templates(view_order);

-- ============================================================================
-- Personalization Templates (Ordered by view_order)
-- ============================================================================
-- Templates are stored as JSONB arrays in the personalization_templates table
-- Each category has one record with templates stored as JSONB
-- View order: 1=basic, 2=lifestyle, 3=goals, 4=challenges, 5=practice, 
--             6=experience, 7=mood, 8=time, 9=reminders, 10=interests

-- 1. Basic Info (form fields - no templates)
INSERT INTO personalization_templates (
    id, category, view_order, screen_key, screen_title, screen_subtitle, screen_type, screen_icon,
    templates, version, created_at, updated_at
)
VALUES (
    uuid_generate_v4(),
    'basic',
    1,
    'basic',
    'Personalize Your Journey',
    'Tell us a bit about you',
    'form',
    '👤',
    '[]'::jsonb,
    1,
    NOW(),
    NULL
)
ON CONFLICT (category) DO UPDATE SET
    view_order = EXCLUDED.view_order,
    screen_key = EXCLUDED.screen_key,
    screen_title = EXCLUDED.screen_title,
    screen_subtitle = EXCLUDED.screen_subtitle,
    screen_type = EXCLUDED.screen_type,
    screen_icon = EXCLUDED.screen_icon,
    templates = EXCLUDED.templates,
    updated_at = NOW(),
    version = personalization_templates.version + 1;

-- 2. Lifestyle & Routine (form fields - no templates)
INSERT INTO personalization_templates (
    id, category, view_order, screen_key, screen_title, screen_subtitle, screen_type, screen_icon,
    templates, version, created_at, updated_at
)
VALUES (
    uuid_generate_v4(),
    'lifestyle',
    2,
    'lifestyle',
    'Lifestyle & Routine',
    'This helps us schedule sessions at the right times',
    'form',
    '⏰',
    '[]'::jsonb,
    1,
    NOW(),
    NULL
)
ON CONFLICT (category) DO UPDATE SET
    view_order = EXCLUDED.view_order,
    screen_key = EXCLUDED.screen_key,
    screen_title = EXCLUDED.screen_title,
    screen_subtitle = EXCLUDED.screen_subtitle,
    screen_type = EXCLUDED.screen_type,
    screen_icon = EXCLUDED.screen_icon,
    templates = EXCLUDED.templates,
    updated_at = NOW(),
    version = personalization_templates.version + 1;

-- 3. Goals (What brings you here today?)
INSERT INTO personalization_templates (
    id, category, view_order, screen_key, screen_title, screen_subtitle, screen_type, screen_icon,
    templates, version, created_at, updated_at
)
VALUES (
    uuid_generate_v4(),
    'goals',
    3,
    'goals',
    'Personalize Your Journey',
    'What brings you here today?',
    'multi',
    '🎯',
    '[
        {"code": "reduce_stress", "label": "Reduce stress", "emoji": "🌿", "display_order": 1, "is_active": true},
        {"code": "sleep_better", "label": "Sleep better", "emoji": "😴", "display_order": 2, "is_active": true},
        {"code": "improve_focus", "label": "Improve focus", "emoji": "🎯", "display_order": 3, "is_active": true},
        {"code": "manage_emotions", "label": "Manage emotions", "emoji": "💞", "display_order": 4, "is_active": true}
    ]'::jsonb,
    1,
    NOW(),
    NULL
)
ON CONFLICT (category) DO UPDATE SET
    view_order = EXCLUDED.view_order,
    screen_key = EXCLUDED.screen_key,
    screen_title = EXCLUDED.screen_title,
    screen_subtitle = EXCLUDED.screen_subtitle,
    screen_type = EXCLUDED.screen_type,
    screen_icon = EXCLUDED.screen_icon,
    templates = EXCLUDED.templates,
    updated_at = NOW(),
    version = personalization_templates.version + 1;

-- 4. Challenges (Which challenges do you face most often?)
INSERT INTO personalization_templates (
    id, category, view_order, screen_key, screen_title, screen_subtitle, screen_type, screen_icon,
    templates, version, created_at, updated_at
)
VALUES (
    uuid_generate_v4(),
    'challenges',
    4,
    'challenges',
    'Personalize Your Journey',
    'Which challenges do you face most often?',
    'multi',
    '💪',
    '[
        {"code": "overthinking", "label": "Overthinking", "emoji": "🤯", "display_order": 1, "is_active": true},
        {"code": "burnout", "label": "Burnout", "emoji": "🔥", "display_order": 2, "is_active": true},
        {"code": "fatigue", "label": "Fatigue", "emoji": "🥱", "display_order": 3, "is_active": true},
        {"code": "insomnia", "label": "Insomnia", "emoji": "🌙", "display_order": 4, "is_active": true},
        {"code": "low_motivation", "label": "Low motivation", "emoji": "🪫", "display_order": 5, "is_active": true},
        {"code": "loneliness", "label": "Loneliness", "emoji": "🫥", "display_order": 6, "is_active": true},
        {"code": "relationship_stress", "label": "Relationship stress", "emoji": "💔", "display_order": 7, "is_active": true},
        {"code": "anxiety", "label": "Anxiety", "emoji": "😟", "display_order": 8, "is_active": true}
    ]'::jsonb,
    1,
    NOW(),
    NULL
)
ON CONFLICT (category) DO UPDATE SET
    view_order = EXCLUDED.view_order,
    screen_key = EXCLUDED.screen_key,
    screen_title = EXCLUDED.screen_title,
    screen_subtitle = EXCLUDED.screen_subtitle,
    screen_type = EXCLUDED.screen_type,
    screen_icon = EXCLUDED.screen_icon,
    templates = EXCLUDED.templates,
    updated_at = NOW(),
    version = personalization_templates.version + 1;

-- 5. Practice Preferences (What type of practice do you enjoy?)
INSERT INTO personalization_templates (
    id, category, view_order, screen_key, screen_title, screen_subtitle, screen_type, screen_icon,
    templates, version, created_at, updated_at
)
VALUES (
    uuid_generate_v4(),
    'practices',
    5,
    'practice',
    'Personalize Your Journey',
    'What type of practice do you enjoy?',
    'multi',
    '🧘',
    '[
        {"code": "breathing", "label": "Breathing", "emoji": "🫁", "display_order": 1, "is_active": true},
        {"code": "guided_meditation", "label": "Guided meditation", "emoji": "🧘", "display_order": 2, "is_active": true},
        {"code": "soundscape", "label": "Soundscape", "emoji": "🌧️", "display_order": 3, "is_active": true},
        {"code": "short_reflections", "label": "Short reflections", "emoji": "📝", "display_order": 4, "is_active": true},
        {"code": "mindful_journaling", "label": "Mindful journaling", "emoji": "📓", "display_order": 5, "is_active": true}
    ]'::jsonb,
    1,
    NOW(),
    NULL
)
ON CONFLICT (category) DO UPDATE SET
    view_order = EXCLUDED.view_order,
    screen_key = EXCLUDED.screen_key,
    screen_title = EXCLUDED.screen_title,
    screen_subtitle = EXCLUDED.screen_subtitle,
    screen_type = EXCLUDED.screen_type,
    screen_icon = EXCLUDED.screen_icon,
    templates = EXCLUDED.templates,
    updated_at = NOW(),
    version = personalization_templates.version + 1;

-- Practice Preferences (Alias for frontend compatibility)
INSERT INTO personalization_templates (
    id, category, view_order, screen_key, screen_title, screen_subtitle, screen_type, screen_icon,
    templates, version, created_at, updated_at
)
VALUES (
    uuid_generate_v4(),
    'practice_preferences',
    5,
    'practice',
    'Personalize Your Journey',
    'What type of practice do you enjoy?',
    'multi',
    '🧘',
    '[
        {"code": "breathing", "label": "Breathing", "emoji": "🫁", "display_order": 1, "is_active": true},
        {"code": "guided_meditation", "label": "Guided meditation", "emoji": "🧘", "display_order": 2, "is_active": true},
        {"code": "soundscape", "label": "Soundscape", "emoji": "🌧️", "display_order": 3, "is_active": true},
        {"code": "short_reflections", "label": "Short reflections", "emoji": "📝", "display_order": 4, "is_active": true},
        {"code": "mindful_journaling", "label": "Mindful journaling", "emoji": "📓", "display_order": 5, "is_active": true}
    ]'::jsonb,
    1,
    NOW(),
    NULL
)
ON CONFLICT (category) DO UPDATE SET
    view_order = EXCLUDED.view_order,
    screen_key = EXCLUDED.screen_key,
    screen_title = EXCLUDED.screen_title,
    screen_subtitle = EXCLUDED.screen_subtitle,
    screen_type = EXCLUDED.screen_type,
    screen_icon = EXCLUDED.screen_icon,
    templates = EXCLUDED.templates,
    updated_at = NOW(),
    version = personalization_templates.version + 1;

-- 6. Experience Levels (We will tailor difficulty and guidance tone)
INSERT INTO personalization_templates (
    id, category, view_order, screen_key, screen_title, screen_subtitle, screen_type, screen_icon,
    templates, version, created_at, updated_at
)
VALUES (
    uuid_generate_v4(),
    'experience_levels',
    6,
    'experience',
    'Experience Level',
    'We will tailor difficulty and guidance tone',
    'single',
    '📚',
    '[
        {"code": "beginner", "label": "Beginner", "emoji": "🌱", "display_order": 1, "is_active": true},
        {"code": "intermediate", "label": "Intermediate", "emoji": "🌿", "display_order": 2, "is_active": true},
        {"code": "advanced", "label": "Advanced", "emoji": "🌳", "display_order": 3, "is_active": true}
    ]'::jsonb,
    1,
    NOW(),
    NULL
)
ON CONFLICT (category) DO UPDATE SET
    view_order = EXCLUDED.view_order,
    screen_key = EXCLUDED.screen_key,
    screen_title = EXCLUDED.screen_title,
    screen_subtitle = EXCLUDED.screen_subtitle,
    screen_type = EXCLUDED.screen_type,
    screen_icon = EXCLUDED.screen_icon,
    templates = EXCLUDED.templates,
    updated_at = NOW(),
    version = personalization_templates.version + 1;

-- 7. Mood Tendencies (Pick the one that fits you most often)
INSERT INTO personalization_templates (
    id, category, view_order, screen_key, screen_title, screen_subtitle, screen_type, screen_icon,
    templates, version, created_at, updated_at
)
VALUES (
    uuid_generate_v4(),
    'mood_tendencies',
    7,
    'mood',
    'Mood Tendencies',
    'Pick the one that fits you most often',
    'single',
    '😊',
    '[
        {"code": "calm", "label": "Calm", "emoji": "😌", "display_order": 1, "is_active": true},
        {"code": "stressed", "label": "Stressed", "emoji": "😣", "display_order": 2, "is_active": true},
        {"code": "sad", "label": "Sad", "emoji": "😞", "display_order": 3, "is_active": true},
        {"code": "happy", "label": "Happy", "emoji": "😊", "display_order": 4, "is_active": true}
    ]'::jsonb,
    1,
    NOW(),
    NULL
)
ON CONFLICT (category) DO UPDATE SET
    view_order = EXCLUDED.view_order,
    screen_key = EXCLUDED.screen_key,
    screen_title = EXCLUDED.screen_title,
    screen_subtitle = EXCLUDED.screen_subtitle,
    screen_type = EXCLUDED.screen_type,
    screen_icon = EXCLUDED.screen_icon,
    templates = EXCLUDED.templates,
    updated_at = NOW(),
    version = personalization_templates.version + 1;

-- 8. Practice Times (When do you prefer to practice?)
INSERT INTO personalization_templates (
    id, category, view_order, screen_key, screen_title, screen_subtitle, screen_type, screen_icon,
    templates, version, created_at, updated_at
)
VALUES (
    uuid_generate_v4(),
    'practice_times',
    8,
    'time',
    'Personalize Your Journey',
    'When do you prefer to practice?',
    'single',
    '🌅',
    '[
        {"code": "morning", "label": "Morning", "emoji": "🌅", "display_order": 1, "is_active": true},
        {"code": "afternoon", "label": "Afternoon", "emoji": "🌤️", "display_order": 2, "is_active": true},
        {"code": "night", "label": "Night", "emoji": "🌃", "display_order": 3, "is_active": true}
    ]'::jsonb,
    1,
    NOW(),
    NULL
)
ON CONFLICT (category) DO UPDATE SET
    view_order = EXCLUDED.view_order,
    screen_key = EXCLUDED.screen_key,
    screen_title = EXCLUDED.screen_title,
    screen_subtitle = EXCLUDED.screen_subtitle,
    screen_type = EXCLUDED.screen_type,
    screen_icon = EXCLUDED.screen_icon,
    templates = EXCLUDED.templates,
    updated_at = NOW(),
    version = personalization_templates.version + 1;

-- 9. Reminder Times (Notifications & Reminders)
INSERT INTO personalization_templates (
    id, category, view_order, screen_key, screen_title, screen_subtitle, screen_type, screen_icon,
    templates, version, created_at, updated_at
)
VALUES (
    uuid_generate_v4(),
    'reminders',
    9,
    'reminders',
    'Notifications & Reminders',
    'Choose when you want gentle nudges',
    'multi',
    '🔔',
    '[
        {"code": "morning", "label": "Morning check-in", "emoji": "🌞", "display_order": 1, "is_active": true},
        {"code": "midday", "label": "Midday break", "emoji": "🌤️", "display_order": 2, "is_active": true},
        {"code": "evening", "label": "Evening reflection", "emoji": "🌙", "display_order": 3, "is_active": true}
    ]'::jsonb,
    1,
    NOW(),
    NULL
)
ON CONFLICT (category) DO UPDATE SET
    view_order = EXCLUDED.view_order,
    screen_key = EXCLUDED.screen_key,
    screen_title = EXCLUDED.screen_title,
    screen_subtitle = EXCLUDED.screen_subtitle,
    screen_type = EXCLUDED.screen_type,
    screen_icon = EXCLUDED.screen_icon,
    templates = EXCLUDED.templates,
    updated_at = NOW(),
    version = personalization_templates.version + 1;

-- 10. Interests (Optional Deep Interests)
INSERT INTO personalization_templates (
    id, category, view_order, screen_key, screen_title, screen_subtitle, screen_type, screen_icon,
    templates, version, created_at, updated_at
)
VALUES (
    uuid_generate_v4(),
    'interests',
    10,
    'interests',
    'Optional Deep Interests',
    'This curates your articles and learning feed',
    'multi',
    '📖',
    '[
        {"code": "mindfulness", "label": "Mindfulness", "emoji": "🧠", "display_order": 1, "is_active": true},
        {"code": "sleep_science", "label": "Sleep science", "emoji": "🛌", "display_order": 2, "is_active": true},
        {"code": "productivity", "label": "Productivity", "emoji": "⚡", "display_order": 3, "is_active": true},
        {"code": "relationships", "label": "Relationships", "emoji": "💞", "display_order": 4, "is_active": true},
        {"code": "self_compassion", "label": "Self-compassion", "emoji": "💗", "display_order": 5, "is_active": true}
    ]'::jsonb,
    1,
    NOW(),
    NULL
)
ON CONFLICT (category) DO UPDATE SET
    view_order = EXCLUDED.view_order,
    screen_key = EXCLUDED.screen_key,
    screen_title = EXCLUDED.screen_title,
    screen_subtitle = EXCLUDED.screen_subtitle,
    screen_type = EXCLUDED.screen_type,
    screen_icon = EXCLUDED.screen_icon,
    templates = EXCLUDED.templates,
    updated_at = NOW(),
    version = personalization_templates.version + 1;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- View all templates ordered by view_order
-- SELECT category, view_order, screen_key, screen_title, screen_type, jsonb_array_length(templates::jsonb) as template_count, version
-- FROM personalization_templates
-- WHERE view_order > 0
-- ORDER BY view_order;

-- View templates for a specific category
-- SELECT templates
-- FROM personalization_templates
-- WHERE category = 'goals';

-- ============================================================================
-- Notes
-- ============================================================================
-- 
-- Template Categories (view_order):
--   1. basic - Basic info (form fields)
--   2. lifestyle - Lifestyle & Routine (form fields)
--   3. goals - What brings you here today? (multi-select)
--   4. challenges - Which challenges do you face most often? (multi-select)
--   5. practices - What type of practice do you enjoy? (multi-select)
--   6. experience_levels - Experience Level (single-select)
--   7. mood_tendencies - Mood Tendencies (single-select)
--   8. practice_times - When do you prefer to practice? (single-select)
--   9. reminders - Notifications & Reminders (multi-select)
--  10. interests - Optional Deep Interests (multi-select)
--
-- Note: Consent screen (view_order 11) is excluded as it's handled separately
--
-- Static Options (not templates, but enum values):
--   - age_range: Dropdown options (13-17, 18-24, etc.)
--   - gender: Dropdown options (male, female, non_binary, prefer_not_say)
--   - work_hours: Dropdown options (under_4, 4_6, etc.)
--   - screen_time: Dropdown options (under_2, 2_4, etc.)
--
-- Template Structure:
--   Each template object contains:
--     - code: Unique identifier (used in user_profiles JSONB arrays)
--     - label: Display text
--     - emoji: Optional emoji icon
--     - display_order: Sort order (lower numbers appear first)
--     - is_active: Whether the template is currently available
--
-- Screen Metadata:
--   Each category has screen metadata:
--     - view_order: Order in onboarding flow (1-10)
--     - screen_key: Frontend screen key (basic, lifestyle, goals, etc.)
--     - screen_title: Screen title
--     - screen_subtitle: Screen subtitle
--     - screen_type: Screen type (form, multi, single, consent)
--     - screen_icon: Screen icon emoji
--
-- ============================================================================
