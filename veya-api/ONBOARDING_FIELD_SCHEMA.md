# Onboarding Field Schema Design

## Overview

This document defines the JSON structure for onboarding template steps that allows the frontend to dynamically render appropriate components based on field types.

## Field Types

Based on `Personalize.tsx` analysis, we have the following field types:

1. **Text Input** - Single-line text (name, occupation)
2. **Dropdown** - Select from predefined options (age, gender, work hours)
3. **Time Picker** - Single time selection (07:30)
4. **Time Range Picker** - Time range selection (07:30 - 09:00)
5. **Multi-Select** - Multiple choices from options (goals, challenges)
6. **Single-Select** - Single choice from options (experience, mood)
7. **Switch/Toggle** - Boolean consent

## JSON Structure

### Screen-Level Structure

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
        "max_length": 100,
        "pattern": null
      },
      "keyboard_type": "default"
    },
    {
      "field_key": "age_range",
      "field_type": "dropdown",
      "label": "Age range",
      "placeholder": "Select age range",
      "data_type": "string",
      "required": true,
      "optional": false,
      "options": [
        {"code": "13-17", "label": "13-17"},
        {"code": "18-24", "label": "18-24"},
        {"code": "25-34", "label": "25-34"}
      ],
      "options_source": "static" // or "template_category"
    },
    {
      "field_key": "wake_time",
      "field_type": "time",
      "label": "Wake-up time",
      "placeholder": "Select time",
      "data_type": "string",
      "required": true,
      "optional": false,
      "format": "HH:mm",
      "allow_range": false,
      "default_value": "07:00"
    },
    {
      "field_key": "sleep_time",
      "field_type": "time",
      "label": "Sleep time",
      "placeholder": "Select time",
      "data_type": "string",
      "required": true,
      "optional": false,
      "format": "HH:mm",
      "allow_range": true, // Can be single time or range
      "range_format": "HH:mm - HH:mm"
    }
  ],
  "templates": [] // For multi/single-select screens
}
```

### Field Type Definitions

#### 1. Text Field (`field_type: "text"`)

```json
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
    "max_length": 100,
    "pattern": null
  },
  "keyboard_type": "default" // "default" | "numeric" | "email" | "phone"
}
```

#### 2. Dropdown Field (`field_type: "dropdown"`)

```json
{
  "field_key": "age_range",
  "field_type": "dropdown",
  "label": "Age range",
  "placeholder": "Select age range",
  "data_type": "string",
  "required": true,
  "optional": false,
  "options": [
    {"code": "13-17", "label": "13-17"},
    {"code": "18-24", "label": "18-24"}
  ],
  "options_source": "static" // "static" | "template_category"
}
```

#### 3. Time Picker (`field_type: "time"`)

```json
{
  "field_key": "wake_time",
  "field_type": "time",
  "label": "Wake-up time",
  "placeholder": "Select time",
  "data_type": "string",
  "required": true,
  "optional": false,
  "format": "HH:mm",
  "allow_range": false,
  "default_value": "07:00",
  "time_picker_config": {
    "minute_interval": 5,
    "show_seconds": false
  }
}
```

#### 4. Time Range Picker (`field_type: "time_range"`)

```json
{
  "field_key": "sleep_time",
  "field_type": "time_range",
  "label": "Sleep time",
  "placeholder": "Select time range",
  "data_type": "string",
  "required": true,
  "optional": false,
  "format": "HH:mm - HH:mm",
  "default_value": "22:00 - 23:00",
  "time_picker_config": {
    "minute_interval": 5,
    "allow_single": true // Can be single time or range
  }
}
```

#### 5. Multi-Select (`field_type: "multi_select"`)

```json
{
  "field_key": "goals",
  "field_type": "multi_select",
  "label": "What brings you here today?",
  "data_type": "array",
  "required": true,
  "optional": false,
  "min_selections": 1,
  "max_selections": null, // null = unlimited
  "templates_category": "goals", // References template category
  "display_style": "grid" // "grid" | "list"
}
```

#### 6. Single-Select (`field_type: "single_select"`)

```json
{
  "field_key": "experience_level",
  "field_type": "single_select",
  "label": "Experience Level",
  "data_type": "string",
  "required": true,
  "optional": false,
  "templates_category": "experience_levels",
  "display_style": "grid"
}
```

#### 7. Switch/Toggle (`field_type: "switch"`)

```json
{
  "field_key": "data_consent",
  "field_type": "switch",
  "label": "I agree to use my wellness data for personalized insights",
  "data_type": "boolean",
  "required": true,
  "optional": false,
  "default_value": false,
  "consent_text": "Your data stays secure and is never shared with third parties."
}
```

## Complete Example: Basic Screen

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
      "placeholder": "Select age range",
      "data_type": "string",
      "required": true,
      "optional": false,
      "options_source": "static",
      "options": [
        {"code": "13-17", "label": "13-17"},
        {"code": "18-24", "label": "18-24"},
        {"code": "25-34", "label": "25-34"},
        {"code": "35-44", "label": "35-44"},
        {"code": "45-54", "label": "45-54"},
        {"code": "55-64", "label": "55-64"},
        {"code": "65+", "label": "65+"}
      ]
    },
    {
      "field_key": "gender",
      "field_type": "dropdown",
      "label": "Gender",
      "placeholder": "Select gender",
      "data_type": "string",
      "required": false,
      "optional": true,
      "options_source": "static",
      "options": [
        {"code": "male", "label": "Male"},
        {"code": "female", "label": "Female"},
        {"code": "non_binary", "label": "Non-binary"},
        {"code": "prefer_not_say", "label": "Prefer not to say"}
      ]
    },
    {
      "field_key": "occupation",
      "field_type": "text",
      "label": "Occupation",
      "placeholder": "Enter your occupation",
      "data_type": "string",
      "required": false,
      "optional": true,
      "validation": {
        "max_length": 100
      },
      "keyboard_type": "default"
    }
  ],
  "templates": []
}
```

## Complete Example: Lifestyle Screen

```json
{
  "id": "uuid",
  "category": "lifestyle",
  "view_order": 2,
  "screen_key": "lifestyle",
  "screen_title": "Lifestyle & Routine",
  "screen_subtitle": "This helps us schedule sessions at the right times",
  "screen_type": "form",
  "screen_icon": "⏰",
  "fields": [
    {
      "field_key": "wake_time",
      "field_type": "time",
      "label": "Wake-up time",
      "placeholder": "Select time",
      "data_type": "string",
      "required": true,
      "optional": false,
      "format": "HH:mm",
      "allow_range": false,
      "default_value": "07:00"
    },
    {
      "field_key": "sleep_time",
      "field_type": "time_range",
      "label": "Sleep time",
      "placeholder": "Select time range",
      "data_type": "string",
      "required": true,
      "optional": false,
      "format": "HH:mm - HH:mm",
      "allow_range": true,
      "time_picker_config": {
        "minute_interval": 5,
        "allow_single": true
      }
    },
    {
      "field_key": "work_hours",
      "field_type": "dropdown",
      "label": "Average daily work hours",
      "placeholder": "Select work hours",
      "data_type": "string",
      "required": true,
      "optional": false,
      "options_source": "static",
      "options": [
        {"code": "under_4", "label": "Under 4 hours"},
        {"code": "4_6", "label": "4-6 hours"},
        {"code": "6_8", "label": "6-8 hours"},
        {"code": "8_10", "label": "8-10 hours"},
        {"code": "10_12", "label": "10-12 hours"},
        {"code": "over_12", "label": "Over 12 hours"}
      ]
    },
    {
      "field_key": "screen_time",
      "field_type": "dropdown",
      "label": "Daily screen time",
      "placeholder": "Select screen time",
      "data_type": "string",
      "required": true,
      "optional": false,
      "options_source": "static",
      "options": [
        {"code": "under_2", "label": "Under 2 hours"},
        {"code": "2_4", "label": "2-4 hours"},
        {"code": "4_6", "label": "4-6 hours"},
        {"code": "6_8", "label": "6-8 hours"},
        {"code": "8_10", "label": "8-10 hours"},
        {"code": "over_10", "label": "Over 10 hours"}
      ]
    }
  ],
  "templates": []
}
```

## Complete Example: Goals Screen (Multi-Select)

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
      "optional": false,
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
    },
    {
      "code": "sleep_better",
      "label": "Sleep better",
      "emoji": "😴",
      "display_order": 2,
      "is_active": true
    }
  ]
}
```

## Complete Example: Consent Screen

```json
{
  "id": "uuid",
  "category": "consent",
  "view_order": 11,
  "screen_key": "consent",
  "screen_title": "Data Privacy & Consent",
  "screen_subtitle": "Your wellness journey, your data",
  "screen_type": "consent",
  "screen_icon": "🔒",
  "fields": [
    {
      "field_key": "data_consent",
      "field_type": "switch",
      "label": "I agree to use my wellness data for personalized insights",
      "data_type": "boolean",
      "required": true,
      "optional": false,
      "default_value": false,
      "consent_text": "We use your wellness data to personalize your experience—recommending sessions, articles, and reminders that fit your goals and challenges. Your data stays secure and is never shared with third parties. You can update your preferences anytime in settings."
    }
  ],
  "templates": []
}
```

## Field Type Reference

| Field Type | Data Type | Component | Use Case |
|------------|-----------|-----------|----------|
| `text` | `string` | TextInput | Name, occupation |
| `dropdown` | `string` | Dropdown/Select | Age, gender, work hours |
| `time` | `string` | TimePicker | Single time (HH:mm) |
| `time_range` | `string` | TimeRangePicker | Time range (HH:mm - HH:mm) |
| `multi_select` | `array` | ChoiceItem (multiple) | Goals, challenges |
| `single_select` | `string` | ChoiceItem (single) | Experience, mood |
| `switch` | `boolean` | Switch/Toggle | Consent |

## Data Type Mappings

| Field Type | Backend Storage | Frontend Value |
|------------|----------------|----------------|
| `text` | `string` | `string` |
| `dropdown` | `string` | `string` (option code) |
| `time` | `string` | `"HH:mm"` format |
| `time_range` | `string` | `"HH:mm - HH:mm"` format |
| `multi_select` | `string[]` (JSONB array) | `string[]` (array of codes) |
| `single_select` | `string` | `string` (selected code) |
| `switch` | `boolean` | `boolean` |

## Frontend Component Mapping

```typescript
// Pseudo-code for dynamic rendering
function renderField(field: Field) {
  switch (field.field_type) {
    case 'text':
      return <TextField {...field} />;
    case 'dropdown':
      return <Dropdown {...field} options={field.options} />;
    case 'time':
      return <TimePicker {...field} allowRange={false} />;
    case 'time_range':
      return <TimePicker {...field} allowRange={true} />;
    case 'multi_select':
      return <MultiSelectChoice {...field} templates={screen.templates} />;
    case 'single_select':
      return <SingleSelectChoice {...field} templates={screen.templates} />;
    case 'switch':
      return <Switch {...field} />;
  }
}
```

## Database Schema Changes

We need to add a `fields` JSONB column to `personalization_templates` table to store field definitions for form screens.

