# Onboarding Templates Setup

This document describes how personalization templates are set up based on the onboarding screens.

## Overview

The onboarding screens in the frontend (`Personalize.tsx`) collect various user preferences. These preferences are stored as template codes in the `user_profiles` table, and the available options are stored in the `personalization_templates` table.

## Template Categories

### Multi-Select Templates

These allow users to select multiple options:

1. **Goals** (`goals`)
   - What brings you here today?
   - Codes: `reduce_stress`, `sleep_better`, `improve_focus`, `manage_emotions`

2. **Challenges** (`challenges`)
   - Which challenges do you face most often?
   - Codes: `overthinking`, `burnout`, `fatigue`, `insomnia`, `low_motivation`, `loneliness`, `relationship_stress`, `anxiety`

3. **Practice Preferences** (`practice_preferences` / `practices`)
   - What type of practice do you enjoy?
   - Codes: `breathing`, `guided_meditation`, `soundscape`, `short_reflections`, `mindful_journaling`

4. **Interests** (`interests`)
   - Optional deep interests
   - Codes: `mindfulness`, `sleep_science`, `productivity`, `relationships`, `self_compassion`

5. **Reminder Times** (`reminders`)
   - Notifications & Reminders
   - Codes: `morning`, `midday`, `evening`

### Single-Select Templates

These allow users to select one option:

1. **Practice Times** (`practice_times`)
   - When do you prefer to practice?
   - Codes: `morning`, `afternoon`, `night`

2. **Mood Tendencies** (`mood_tendencies`)
   - Pick the one that fits you most often
   - Codes: `calm`, `stressed`, `sad`, `happy`

3. **Experience Levels** (`experience_levels`)
   - We will tailor difficulty and guidance tone
   - Codes: `beginner`, `intermediate`, `advanced`

### Static Options (Not Templates)

These are enum-like values that don't need templates:

1. **Age Ranges**: `13-17`, `18-24`, `25-34`, `35-44`, `45-54`, `55-64`, `65+`
2. **Genders**: `male`, `female`, `non_binary`, `prefer_not_say`
3. **Work Hours**: `under_4`, `4_6`, `6_8`, `8_10`, `10_12`, `over_12`
4. **Screen Time**: `under_2`, `2_4`, `4_6`, `6_8`, `8_10`, `over_10`

## Database Schema

Templates are stored in the `personalization_templates` table:

```sql
CREATE TABLE personalization_templates (
    id UUID PRIMARY KEY,
    category VARCHAR UNIQUE NOT NULL,
    templates JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

Each category has one record with templates stored as a JSONB array:

```json
[
  {
    "code": "reduce_stress",
    "label": "Reduce stress",
    "emoji": "🌿",
    "display_order": 1,
    "is_active": true
  },
  ...
]
```

## Initialization Methods

### Method 1: Using init.sql (Recommended for Production)

The `init.sql` script seeds all templates directly in the database:

```bash
# Via Docker
docker-compose exec -T db psql -U veya_user -d veya -f /docker-entrypoint-initdb.d/init.sql

# Or manually
psql -U veya_user -d veya -f init.sql
```

**Note**: The `init.sql` script is automatically run when the database container is first created (via volume mount in `docker-compose.yml`).

### Method 2: Using Python Script (Development)

Use the template seeder utility:

```bash
# Via Docker
docker-compose exec api python -c "from app.utils.template_seeder import seed_templates; from app.db.database import engine, Session; session = Session(engine); seed_templates(session, overwrite=True)"

# Or via API endpoint
curl -X POST http://localhost:8000/api/admin/templates/reset
```

### Method 3: Using API Endpoint

Reset templates via admin API:

```bash
curl -X POST http://localhost:8000/api/admin/templates/reset
```

## Template Structure

Each template object contains:

- `code` (string): Unique identifier used in `user_profiles` JSONB arrays
- `label` (string): Display text shown to users
- `emoji` (string, optional): Emoji icon for visual representation
- `display_order` (integer): Sort order (lower numbers appear first)
- `is_active` (boolean): Whether the template is currently available

## Frontend Integration

The frontend (`Personalize.tsx`) uses these templates to display options:

1. **Goals**: Maps to `goals` field in `user_profiles`
2. **Challenges**: Maps to `challenges` field in `user_profiles`
3. **Practice Preferences**: Maps to `practice_preferences` field in `user_profiles`
4. **Interests**: Maps to `interests` field in `user_profiles`
5. **Reminder Times**: Maps to `reminder_times` field in `user_profiles`
6. **Practice Times**: Maps to `preferred_practice_time` field in `user_profiles`
7. **Mood Tendencies**: Maps to `mood_tendency` field in `user_profiles`
8. **Experience Levels**: Maps to `experience_level` field in `user_profiles`

## API Endpoints

### Get Templates

```bash
# Get all templates for a category
GET /api/templates/{category}

# Example: Get goals
GET /api/templates/goals
```

### Admin Endpoints

```bash
# Reset all templates to defaults
POST /api/admin/templates/reset

# Update templates for a category
PUT /api/admin/templates/{category}
```

## Verification

Check if templates are seeded:

```sql
-- View all template categories
SELECT category, jsonb_array_length(templates) as template_count, version
FROM personalization_templates
ORDER BY category;

-- View templates for a specific category
SELECT templates
FROM personalization_templates
WHERE category = 'goals';
```

## Files

- `init.sql`: SQL script to seed templates (auto-runs on DB initialization)
- `app/utils/personalization_defaults.py`: Python defaults for templates
- `app/utils/template_seeder.py`: Python utility to seed templates
- `app/api/routes/templates.py`: API endpoints for getting templates
- `app/api/routes/admin_templates.py`: Admin endpoints for managing templates

## Adding New Templates

1. **Update `personalization_defaults.py`**: Add new templates to the appropriate category
2. **Update `init.sql`**: Add SQL INSERT statements for new templates
3. **Run seeder**: Execute the seeder to update the database
4. **Update frontend**: Add new options to `Personalize.tsx` if needed

## Notes

- Templates are versioned (`version` field) for tracking changes
- Templates can be deactivated by setting `is_active: false`
- The `practice_preferences` category is an alias for `practices` (frontend compatibility)
- Static options (age ranges, genders, etc.) are validated in application code, not stored as templates

