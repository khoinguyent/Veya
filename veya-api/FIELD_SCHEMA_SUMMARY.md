# Onboarding Field Schema - Summary

## Overview

This document summarizes the JSON structure for onboarding templates that enables dynamic frontend rendering based on field types and data types.

## Key Features

1. **Dynamic Field Types**: Support for text, dropdown, time, time_range, multi_select, single_select, and switch
2. **Data Type Handling**: Proper data types (string, array, boolean) with validation
3. **Component Mapping**: Clear mapping between field types and frontend components
4. **Flexible Configuration**: Field definitions stored in database for easy updates

## Field Types

| Field Type | Data Type | Component | Use Case | Example |
|------------|-----------|-----------|----------|---------|
| `text` | `string` | TextInput | Name, occupation | `"John Doe"` |
| `dropdown` | `string` | Dropdown | Age, gender | `"18-24"` |
| `time` | `string` | TimePicker | Single time | `"07:30"` |
| `time_range` | `string` | TimeRangePicker | Time range | `"22:00 - 23:00"` |
| `multi_select` | `array` | MultiSelectChoice | Goals, challenges | `["reduce_stress", "sleep_better"]` |
| `single_select` | `string` | SingleSelectChoice | Experience, mood | `"beginner"` |
| `switch` | `boolean` | Switch | Consent | `true` |

## Database Schema

### New Column: `fields` (JSONB)

Added to `personalization_templates` table to store field definitions for form screens.

```sql
ALTER TABLE personalization_templates 
ADD COLUMN IF NOT EXISTS fields JSONB DEFAULT '[]'::jsonb;
```

### Model Update

```python
class PersonalizationTemplate(SQLModel, table=True):
    # ... existing fields ...
    fields: List[Dict[str, Any]] = Field(
        default_factory=list,
        sa_column=Column(JSON)
    )
```

## API Response Structure

### Example: Basic Screen (Form)

```json
{
  "id": "uuid",
  "category": "basic",
  "view_order": 1,
  "screen_key": "basic",
  "screen_title": "Personalize Your Journey",
  "screen_subtitle": "Tell us a bit about you",
  "screen_type": "form",
  "screen_icon": "👤",
  "fields": [
    {
      "field_key": "name",
      "field_type": "text",
      "label": "Name",
      "placeholder": "Enter your name",
      "data_type": "string",
      "required": true,
      "optional": false,
      "validation": {
        "min_length": 1,
        "max_length": 100
      },
      "keyboard_type": "default"
    },
    {
      "field_key": "age_range",
      "field_type": "dropdown",
      "label": "Age range",
      "data_type": "string",
      "required": true,
      "options_source": "static",
      "options": [
        {"code": "13-17", "label": "13-17"},
        {"code": "18-24", "label": "18-24"}
      ]
    }
  ],
  "templates": []
}
```

### Example: Goals Screen (Multi-Select)

```json
{
  "id": "uuid",
  "category": "goals",
  "view_order": 3,
  "screen_key": "goals",
  "screen_title": "Personalize Your Journey",
  "screen_subtitle": "What brings you here today?",
  "screen_type": "multi_select",
  "screen_icon": "🎯",
  "fields": [
    {
      "field_key": "goals",
      "field_type": "multi_select",
      "label": "Select your goals",
      "data_type": "array",
      "required": true,
      "min_selections": 1,
      "max_selections": null,
      "templates_category": "goals",
      "display_style": "grid"
    }
  ],
  "templates": [
    {
      "code": "reduce_stress",
      "label": "Reduce stress",
      "emoji": "🌿",
      "display_order": 1,
      "is_active": true
    }
  ]
}
```

## Implementation Steps

### 1. Database Migration

```bash
# Run migration script
docker-compose exec api python scripts/add_fields_column.py
```

### 2. Seed Field Definitions

```bash
# Update templates with field definitions
docker-compose exec api python -c "
from app.utils.template_seeder import seed_templates
from app.db.database import engine, Session
session = Session(engine)
seed_templates(session, overwrite=True)
"
```

### 3. API Endpoint

The `/api/templates/onboarding` endpoint now returns field definitions:

```bash
curl http://localhost:8000/api/templates/onboarding
```

### 4. Frontend Integration

See `FRONTEND_DYNAMIC_RENDERING.md` for complete frontend implementation guide.

## Field Definition Structure

### Common Fields

- `field_key`: Unique identifier for the field
- `field_type`: Type of field (text, dropdown, time, etc.)
- `label`: Display label
- `placeholder`: Placeholder text
- `data_type`: Backend data type (string, array, boolean)
- `required`: Whether field is required
- `optional`: Whether field is optional

### Type-Specific Fields

#### Text Fields
- `validation`: Min/max length, pattern
- `keyboard_type`: default, numeric, email, phone

#### Dropdown Fields
- `options`: Array of {code, label} objects
- `options_source`: "static" or "template_category"

#### Time Fields
- `format`: "HH:mm" or "HH:mm - HH:mm"
- `allow_range`: Boolean for time range support
- `time_picker_config`: Minute interval, etc.

#### Select Fields
- `templates_category`: Category name for template options
- `min_selections`: Minimum number of selections
- `max_selections`: Maximum number (null = unlimited)
- `display_style`: "grid" or "list"

#### Switch Fields
- `default_value`: Default boolean value
- `consent_text`: Additional consent text

## Benefits

1. **Dynamic Rendering**: Frontend can render any field type without hardcoding
2. **Type Safety**: Clear data types and validation rules
3. **Flexible Configuration**: Fields can be updated in database without code changes
4. **Reusable Components**: Common components handle all field types
5. **Easy Maintenance**: New field types can be added by updating schema

## Next Steps

1. ✅ Database schema updated with `fields` column
2. ✅ Model and schemas updated
3. ✅ Field definitions added to defaults
4. ✅ Seeder updated to include fields
5. ✅ API endpoint returns field definitions
6. ⏳ Frontend implementation (see FRONTEND_DYNAMIC_RENDERING.md)
7. ⏳ Update init.sql with field definitions
8. ⏳ Test with frontend integration

