# Why Some Templates Are Empty

## Overview

Some categories in the `personalization_templates` table have empty `templates` arrays (`[]`). This is **intentional and correct** behavior.

## Screens with Empty Templates

The following screens have empty `templates` arrays because they are **form screens** that use `fields` instead:

1. **basic** (view_order: 1)
   - Screen Type: `form`
   - Templates: `0` (empty - correct)
   - Fields: `4` (populated)
   - Fields: name, age_range, gender, occupation

2. **lifestyle** (view_order: 2)
   - Screen Type: `form`
   - Templates: `0` (empty - correct)
   - Fields: `4` (populated)
   - Fields: wake_time, sleep_time, work_hours, screen_time

3. **consent** (view_order: 11)
   - Screen Type: `consent`
   - Templates: `0` (empty - correct)
   - Fields: `1` (populated)
   - Fields: data_consent (switch)

## Why Templates Are Empty

### Form Screens (basic, lifestyle)
- These screens collect **form input** (text fields, dropdowns, time pickers)
- They use the `fields` JSONB column to define form field configurations
- They don't need `templates` because users enter data directly, not select from options

### Consent Screen
- This screen uses a **switch/toggle** for consent
- It uses the `fields` JSONB column to define the consent switch
- It doesn't need `templates` because it's a single boolean consent field

## Screens with Templates

The following screens have **both** templates and fields:

1. **goals** (view_order: 3)
   - Screen Type: `multi` (multi-select)
   - Templates: `4` (reduce_stress, sleep_better, improve_focus, manage_emotions)
   - Fields: `1` (field definition for multi_select)

2. **challenges** (view_order: 4)
   - Screen Type: `multi` (multi-select)
   - Templates: `8` (overthinking, burnout, fatigue, etc.)
   - Fields: `1` (field definition for multi_select)

3. **practices** (view_order: 5)
   - Screen Type: `multi` (multi-select)
   - Templates: `5` (breathing, guided_meditation, soundscape, etc.)
   - Fields: `1` (field definition for multi_select)

4. **experience_levels** (view_order: 6)
   - Screen Type: `single` (single-select)
   - Templates: `3` (beginner, intermediate, advanced)
   - Fields: `1` (field definition for single_select)

5. **mood_tendencies** (view_order: 7)
   - Screen Type: `single` (single-select)
   - Templates: `4` (calm, stressed, sad, happy)
   - Fields: `1` (field definition for single_select)

6. **practice_times** (view_order: 8)
   - Screen Type: `single` (single-select)
   - Templates: `3` (morning, afternoon, night)
   - Fields: `1` (field definition for single_select)

7. **reminders** (view_order: 9)
   - Screen Type: `multi` (multi-select)
   - Templates: `3` (morning, midday, evening)
   - Fields: `1` (field definition for multi_select)

8. **interests** (view_order: 10)
   - Screen Type: `multi` (multi-select)
   - Templates: `5` (mindfulness, sleep_science, productivity, etc.)
   - Fields: `1` (field definition for multi_select)

## Summary

| Screen Type | Templates | Fields | Purpose |
|------------|-----------|--------|---------|
| `form` | Empty (`[]`) | Populated | Collect form input (text, dropdown, time) |
| `consent` | Empty (`[]`) | Populated | Consent switch/toggle |
| `multi` | Populated | Populated | Multi-select from options |
| `single` | Populated | Populated | Single-select from options |

## Conclusion

**Empty templates are correct** for form and consent screens. These screens use the `fields` column instead to define:
- Form field types (text, dropdown, time, time_range)
- Validation rules
- Options for dropdowns
- Field metadata

The data structure is working as designed! ✅

