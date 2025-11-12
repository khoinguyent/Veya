# Frontend Dynamic Rendering Guide

## Overview

The `/api/templates/onboarding` endpoint returns a structured JSON response that allows the frontend to dynamically render each onboarding step with appropriate components based on field types.

## Response Structure

Each screen in the response includes:
- **Screen metadata**: title, subtitle, icon, type
- **Fields**: Array of field definitions with type, validation, options, etc.
- **Templates**: Array of selectable options (for multi/single-select screens)

## Example Response

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
        {"code": "18-24", "label": "18-24"}
      ]
    }
  ],
  "templates": []
}
```

## Frontend Implementation

### 1. Fetch Onboarding Templates

```typescript
const fetchOnboardingTemplates = async () => {
  const response = await fetch('http://localhost:8000/api/templates/onboarding');
  const screens = await response.json();
  return screens;
};
```

### 2. Dynamic Field Rendering

```typescript
import React from 'react';
import { View, Text, TextInput, Switch } from 'react-native';
import Dropdown from './components/Dropdown';
import TimePicker from './components/TimePicker';
import MultiSelectChoice from './components/MultiSelectChoice';
import SingleSelectChoice from './components/SingleSelectChoice';

interface Field {
  field_key: string;
  field_type: string;
  label: string;
  placeholder?: string;
  data_type: string;
  required: boolean;
  optional: boolean;
  // ... other properties
}

interface Screen {
  screen_key: string;
  screen_title: string;
  screen_subtitle: string;
  screen_type: string;
  screen_icon: string;
  fields: Field[];
  templates: Array<{
    code: string;
    label: string;
    emoji?: string;
  }>;
}

function renderField(
  field: Field,
  value: any,
  onChange: (key: string, value: any) => void,
  screen: Screen
) {
  switch (field.field_type) {
    case 'text':
      return (
        <TextField
          key={field.field_key}
          label={field.label}
          placeholder={field.placeholder}
          value={value || ''}
          onChangeText={(text) => onChange(field.field_key, text)}
          keyboardType={field.keyboard_type || 'default'}
          required={field.required}
          optional={field.optional}
        />
      );

    case 'dropdown':
      return (
        <Dropdown
          key={field.field_key}
          label={field.label}
          placeholder={field.placeholder}
          value={value || ''}
          options={field.options || []}
          onSelect={(option) => onChange(field.field_key, option.code)}
          required={field.required}
          optional={field.optional}
        />
      );

    case 'time':
      return (
        <TimePicker
          key={field.field_key}
          label={field.label}
          placeholder={field.placeholder}
          value={value || ''}
          onSelect={(time) => onChange(field.field_key, time)}
          allowRange={false}
          format={field.format || 'HH:mm'}
          required={field.required}
        />
      );

    case 'time_range':
      return (
        <TimePicker
          key={field.field_key}
          label={field.label}
          placeholder={field.placeholder}
          value={value || ''}
          onSelect={(time) => onChange(field.field_key, time)}
          allowRange={true}
          format={field.format || 'HH:mm - HH:mm'}
          required={field.required}
        />
      );

    case 'multi_select':
      return (
        <MultiSelectChoice
          key={field.field_key}
          label={field.label}
          templates={screen.templates}
          selected={value || []}
          onToggle={(code) => {
            const current = value || [];
            const updated = current.includes(code)
              ? current.filter((c: string) => c !== code)
              : [...current, code];
            onChange(field.field_key, updated);
          }}
          minSelections={field.min_selections}
          maxSelections={field.max_selections}
          displayStyle={field.display_style || 'grid'}
        />
      );

    case 'single_select':
      return (
        <SingleSelectChoice
          key={field.field_key}
          label={field.label}
          templates={screen.templates}
          selected={value || ''}
          onSelect={(code) => onChange(field.field_key, code)}
          displayStyle={field.display_style || 'grid'}
        />
      );

    case 'switch':
      return (
        <Switch
          key={field.field_key}
          label={field.label}
          value={value || false}
          onValueChange={(val) => onChange(field.field_key, val)}
          consentText={field.consent_text}
        />
      );

    default:
      return null;
  }
}
```

### 3. Render Screen

```typescript
function OnboardingScreen({ screen, answers, onAnswerChange }: {
  screen: Screen;
  answers: Record<string, any>;
  onAnswerChange: (key: string, value: any) => void;
}) {
  return (
    <View>
      <Text>{screen.screen_icon} {screen.screen_title}</Text>
      <Text>{screen.screen_subtitle}</Text>
      
      {screen.fields.map((field) =>
        renderField(
          field,
          answers[field.field_key],
          onAnswerChange,
          screen
        )
      )}
    </View>
  );
}
```

### 4. Complete Onboarding Flow

```typescript
function OnboardingFlow() {
  const [screens, setScreens] = useState<Screen[]>([]);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchOnboardingTemplates().then(setScreens);
  }, []);

  const handleAnswerChange = (key: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentScreenIndex < screens.length - 1) {
      setCurrentScreenIndex(currentScreenIndex + 1);
    } else {
      // Submit onboarding
      submitOnboarding(answers);
    }
  };

  if (screens.length === 0) return <Loading />;

  const currentScreen = screens[currentScreenIndex];

  return (
    <OnboardingScreen
      screen={currentScreen}
      answers={answers}
      onAnswerChange={handleAnswerChange}
    />
  );
}
```

## Field Type Reference

| Field Type | Component | Data Type | Example Value |
|------------|-----------|-----------|---------------|
| `text` | TextInput | `string` | `"John Doe"` |
| `dropdown` | Dropdown | `string` | `"18-24"` |
| `time` | TimePicker | `string` | `"07:30"` |
| `time_range` | TimeRangePicker | `string` | `"22:00 - 23:00"` |
| `multi_select` | MultiSelectChoice | `string[]` | `["reduce_stress", "sleep_better"]` |
| `single_select` | SingleSelectChoice | `string` | `"beginner"` |
| `switch` | Switch | `boolean` | `true` |

## Validation

Each field can include validation rules:

```typescript
interface Validation {
  min_length?: number;
  max_length?: number;
  pattern?: string; // Regex pattern
  min_selections?: number;
  max_selections?: number;
}

function validateField(field: Field, value: any): boolean {
  if (field.required && !value) return false;
  
  if (field.validation) {
    if (field.validation.min_length && value.length < field.validation.min_length) {
      return false;
    }
    if (field.validation.max_length && value.length > field.validation.max_length) {
      return false;
    }
    // ... other validations
  }
  
  return true;
}
```

## Benefits

1. **Dynamic Rendering**: Frontend can render any field type without hardcoding
2. **Flexible Configuration**: Field definitions can be updated in database without code changes
3. **Type Safety**: Field definitions include data types and validation
4. **Reusable Components**: Common components can handle all field types
5. **Easy Maintenance**: New field types can be added by updating the schema

