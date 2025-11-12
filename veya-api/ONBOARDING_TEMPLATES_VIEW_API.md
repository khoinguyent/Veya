# Onboarding Templates View API

## Overview

The `/api/templates/onboarding` endpoint returns all personalization templates for onboarding screens, ordered by `view_order`. This endpoint includes screen metadata and templates for all onboarding screens (excluding consent).

## Endpoint

### GET /api/templates/onboarding

**Description**: Get all personalization templates ordered by view_order for onboarding flow.

**Authentication**: Not required (public endpoint)

**Response**: `List[PersonalizationTemplateViewResponse]`

## Response Structure

Each item in the response array contains:

```json
{
  "id": "uuid",
  "category": "goals",
  "view_order": 3,
  "screen_key": "goals",
  "screen_title": "Personalize Your Journey",
  "screen_subtitle": "What brings you here today?",
  "screen_type": "multi",
  "screen_icon": "🎯",
  "templates": [
    {
      "code": "reduce_stress",
      "label": "Reduce stress",
      "emoji": "🌿",
      "description": null,
      "display_order": 1,
      "is_active": true
    },
    ...
  ],
  "version": 1,
  "created_at": "2025-11-07T17:57:40.086521",
  "updated_at": null
}
```

## Screen Order (view_order)

The response is ordered by `view_order`, matching the frontend onboarding flow:

1. **basic** (view_order: 1) - Form - "Personalize Your Journey" - "Tell us a bit about you"
2. **lifestyle** (view_order: 2) - Form - "Lifestyle & Routine" - "This helps us schedule sessions at the right times"
3. **goals** (view_order: 3) - Multi-select - "Personalize Your Journey" - "What brings you here today?"
4. **challenges** (view_order: 4) - Multi-select - "Personalize Your Journey" - "Which challenges do you face most often?"
5. **practices** (view_order: 5) - Multi-select - "Personalize Your Journey" - "What type of practice do you enjoy?"
6. **experience_levels** (view_order: 6) - Single-select - "Experience Level" - "We will tailor difficulty and guidance tone"
7. **mood_tendencies** (view_order: 7) - Single-select - "Mood Tendencies" - "Pick the one that fits you most often"
8. **practice_times** (view_order: 8) - Single-select - "Personalize Your Journey" - "When do you prefer to practice?"
9. **reminders** (view_order: 9) - Multi-select - "Notifications & Reminders" - "Choose when you want gentle nudges"
10. **interests** (view_order: 10) - Multi-select - "Optional Deep Interests" - "This curates your articles and learning feed"

**Note**: Consent screen is excluded from this endpoint as it's handled separately.

## Screen Types

- **form**: Form fields (basic, lifestyle) - no templates, just metadata
- **multi**: Multi-select choices (goals, challenges, practices, reminders, interests)
- **single**: Single-select choice (experience_levels, mood_tendencies, practice_times)

## Usage Example

### Get All Onboarding Templates

```bash
curl -X GET "http://localhost:8000/api/templates/onboarding"
```

### Frontend Integration

```typescript
// React/TypeScript example
const getOnboardingTemplates = async () => {
  const response = await fetch('http://localhost:8000/api/templates/onboarding');
  return await response.json();
};

// Usage
const templates = await getOnboardingTemplates();
// templates is an array ordered by view_order (1-10)

// Example: Get goals screen
const goalsScreen = templates.find(t => t.screen_key === 'goals');
console.log(goalsScreen.screen_title); // "Personalize Your Journey"
console.log(goalsScreen.templates); // Array of goal options

// Example: Render screens in order
templates.forEach(screen => {
  console.log(`${screen.view_order}. ${screen.screen_title}`);
  if (screen.templates.length > 0) {
    screen.templates.forEach(template => {
      console.log(`  - ${template.emoji} ${template.label}`);
    });
  }
});
```

## Response Fields

### Screen Metadata
- `id` (UUID): Template category ID
- `category` (string): Category name (basic, lifestyle, goals, etc.)
- `view_order` (int): Order in onboarding flow (1-10)
- `screen_key` (string): Frontend screen key (basic, lifestyle, goals, etc.)
- `screen_title` (string): Screen title
- `screen_subtitle` (string): Screen subtitle/description
- `screen_type` (string): Screen type (form, multi, single)
- `screen_icon` (string): Screen icon emoji

### Templates Array
- `code` (string): Unique identifier (used in user_profiles)
- `label` (string): Display text
- `emoji` (string, optional): Emoji icon
- `description` (string, optional): Template description
- `display_order` (int): Sort order within category
- `is_active` (boolean): Whether template is active

### Metadata
- `version` (int): Template version
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime, optional): Last update timestamp

## Database Schema

The `personalization_templates` table includes:

- `view_order` (INTEGER): Order in onboarding flow
- `screen_key` (VARCHAR): Frontend screen key
- `screen_title` (VARCHAR): Screen title
- `screen_subtitle` (VARCHAR): Screen subtitle
- `screen_type` (VARCHAR): Screen type (form, multi, single)
- `screen_icon` (VARCHAR): Screen icon emoji
- `templates` (JSONB): Array of template objects

## Frontend Mapping

The API response maps directly to the frontend `PAGES` array in `Personalize.tsx`:

```typescript
// Frontend expects:
{
  key: 'goals',
  title: 'Personalize Your Journey',
  subtitle: 'What brings you here today?',
  type: 'multi',
  icon: '🎯',
}

// API returns:
{
  screen_key: 'goals',
  screen_title: 'Personalize Your Journey',
  screen_subtitle: 'What brings you here today?',
  screen_type: 'multi',
  screen_icon: '🎯',
  templates: [...]
}
```

## Notes

- Templates are sorted by `view_order` (ascending)
- Only active templates are included (`is_active: true`)
- Template items within each category are sorted by `display_order`
- Form screens (basic, lifestyle) have empty `templates` arrays
- Consent screen is excluded (handled separately in frontend)

## Comparison with Other Endpoints

### GET /api/templates/all
- Returns all templates in a flat dictionary
- Includes static options (age_ranges, genders, etc.)
- Not ordered by screen flow

### GET /api/templates/{category}
- Returns templates for a specific category
- No screen metadata

### GET /api/templates/onboarding
- Returns all screens in onboarding order
- Includes screen metadata
- Excludes consent screen
- Ordered by view_order

