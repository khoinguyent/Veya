# Schema Refactor Summary: JSONB-Based Personalization

## Changes Made

### 1. Template Storage (Simplified)

**Before**: Separate tables for each template type + junction tables
- `goal_templates` table
- `challenge_templates` table
- `practice_preference_templates` table
- `interest_templates` table
- `reminder_templates` table
- Junction tables for many-to-many relationships

**After**: Single table with JSONB column
- `personalization_templates` table
  - `category` (goals, challenges, practices, interests, reminders)
  - `templates` (JSONB array storing all templates for that category)
  - `version` (for tracking changes)

### 2. User Selections

**Before**: JSON arrays (still works, but now optimized for JSONB)
**After**: JSONB arrays in `user_profiles`
- `goals`: JSONB array of template codes
- `challenges`: JSONB array of template codes
- `practice_preferences`: JSONB array of template codes
- `interests`: JSONB array of template codes
- `reminder_times`: JSONB array of template codes

### 3. Consent

**Already Implemented**: Boolean fields
- `data_consent`: Boolean (consent for data usage)
- `marketing_consent`: Boolean (consent for marketing)

## Benefits

1. **Simpler Schema**: One table for all templates instead of five
2. **Flexibility**: Easy to add new template fields without schema changes
3. **Performance**: JSONB is optimized for querying in PostgreSQL
4. **No Junction Tables**: Direct storage in JSONB arrays
5. **Easier Management**: All templates for a category in one place

## Database Structure

### `personalization_templates` Table

```sql
CREATE TABLE personalization_templates (
    id UUID PRIMARY KEY,
    category VARCHAR NOT NULL UNIQUE,  -- goals, challenges, practices, interests, reminders
    templates JSONB NOT NULL,          -- Array of template objects
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Example Data**:
```json
{
  "category": "goals",
  "templates": [
    {"code": "reduce_stress", "label": "Reduce stress", "emoji": "🌿", "display_order": 1, "is_active": true},
    {"code": "sleep_better", "label": "Sleep better", "emoji": "😴", "display_order": 2, "is_active": true}
  ]
}
```

### `user_profiles` Table (Updated)

```sql
CREATE TABLE user_profiles (
    -- ... other fields ...
    goals JSONB DEFAULT '[]',              -- ["reduce_stress", "sleep_better"]
    challenges JSONB DEFAULT '[]',          -- ["overthinking", "anxiety"]
    practice_preferences JSONB DEFAULT '[]', -- ["breathing", "guided_meditation"]
    interests JSONB DEFAULT '[]',           -- ["mindfulness", "sleep_science"]
    reminder_times JSONB DEFAULT '[]',      -- ["morning", "evening"]
    data_consent BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE
);
```

## API Changes

### Template Endpoints (Updated)

**Get templates for a category**:
```bash
GET /api/templates/goals
GET /api/templates/challenges
# etc.
```

**Get all templates**:
```bash
GET /api/templates/all
```

### Admin Endpoints (Updated)

**Get category templates**:
```bash
GET /api/admin/templates/{category}
# Returns all templates (including inactive) for a category
```

**Update category templates**:
```bash
PUT /api/admin/templates/{category}
Body: {
  "templates": [
    {"code": "...", "label": "...", "emoji": "...", "display_order": 1, "is_active": true},
    ...
  ]
}
```

**Add template to category**:
```bash
POST /api/admin/templates/{category}/add
Body: {
  "code": "increase_energy",
  "label": "Increase energy",
  "emoji": "⚡",
  "display_order": 5,
  "is_active": true
}
```

**Delete template from category**:
```bash
DELETE /api/admin/templates/{category}/{template_code}
# Deactivates the template (sets is_active = false)
```

## Migration Steps

1. **Drop old tables** (if they exist):
   ```sql
   DROP TABLE IF EXISTS user_profile_reminders;
   DROP TABLE IF EXISTS user_profile_interests;
   DROP TABLE IF EXISTS user_profile_practices;
   DROP TABLE IF EXISTS user_profile_challenges;
   DROP TABLE IF EXISTS user_profile_goals;
   DROP TABLE IF EXISTS reminder_templates;
   DROP TABLE IF EXISTS interest_templates;
   DROP TABLE IF EXISTS practice_preference_templates;
   DROP TABLE IF EXISTS challenge_templates;
   DROP TABLE IF EXISTS goal_templates;
   ```

2. **Create new table**:
   ```sql
   CREATE TABLE personalization_templates (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       category VARCHAR NOT NULL UNIQUE,
       templates JSONB NOT NULL DEFAULT '[]',
       version INTEGER DEFAULT 1,
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP
   );
   ```

3. **Convert JSON to JSONB** (if needed):
   ```sql
   ALTER TABLE user_profiles 
     ALTER COLUMN goals TYPE JSONB USING goals::jsonb,
     ALTER COLUMN challenges TYPE JSONB USING challenges::jsonb,
     ALTER COLUMN practice_preferences TYPE JSONB USING practice_preferences::jsonb,
     ALTER COLUMN interests TYPE JSONB USING interests::jsonb,
     ALTER COLUMN reminder_times TYPE JSONB USING reminder_times::jsonb;
   ```

4. **Seed default templates**:
   ```bash
   POST /api/admin/templates/seed-defaults
   ```

## File Changes

### Modified Files
- `app/models/personalization_templates.py` - Simplified to single table
- `app/models/user.py` - Using JSON/JSONB for selections (no changes needed, already JSON)
- `app/utils/template_seeder.py` - Updated to work with new schema
- `app/utils/profile_validator.py` - Updated to work with new schema
- `app/api/routes/templates.py` - Updated to work with new schema
- `app/api/routes/admin_templates.py` - Completely rewritten for new schema
- `app/db/database.py` - Updated imports

### Removed
- Junction table models (UserProfileGoal, UserProfileChallenge, etc.)
- Separate template table models (GoalTemplate, ChallengeTemplate, etc.)

## Testing

1. **Seed templates**:
   ```bash
   curl -X POST "http://localhost:8000/api/admin/templates/seed-defaults" \
     -H "Authorization: Bearer $TOKEN"
   ```

2. **Get templates**:
   ```bash
   curl "http://localhost:8000/api/templates/all"
   ```

3. **Add new goal**:
   ```bash
   curl -X POST "http://localhost:8000/api/admin/templates/goals/add" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "code": "increase_energy",
       "label": "Increase energy",
       "emoji": "⚡",
       "display_order": 5,
       "is_active": true
     }'
   ```

4. **Create user profile**:
   ```bash
   curl -X POST "http://localhost:8000/api/users/me/profile" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "goals": ["reduce_stress", "sleep_better"],
       "challenges": ["overthinking"],
       "data_consent": true
     }'
   ```

## Notes

- JSONB is automatically used by PostgreSQL when using SQLModel's `JSON` type
- No breaking changes to API responses (same format)
- Easier to manage templates (all in one place)
- Better performance with JSONB indexing (optional)
- Consent is stored as boolean fields (as requested)

