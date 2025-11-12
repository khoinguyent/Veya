# Field Definitions Update Summary

## Overview

Updated the `personalization_templates` database to include complete field definitions for all form and consent screens, ensuring compatibility with the frontend `FormFields` component.

## Changes Made

### 1. Added `type` Field for Frontend Compatibility

The frontend `FormFields.tsx` component checks for `field.type`, but the API was returning `field_type`. Updated the database fields to include both:
- `field_type`: Backend standard (text, dropdown, time, time_range, multi_select, single_select, switch)
- `type`: Frontend compatibility (mapped from `field_type`, with `time_range` -> `time`)

### 2. Added `id` Field to Dropdown Options

The frontend `Dropdown` component expects options with `id` field. Updated all dropdown options to include both `code` and `id`:
- `code`: Backend identifier
- `id`: Frontend identifier (same as `code` for compatibility)
- `label`: Display label

### 3. Updated Field Definitions

All field definitions now include:
- `field_key`: Backend field identifier
- `field_type`: Backend field type
- `type`: Frontend-compatible field type
- `label`: Display label
- `placeholder`: Placeholder text
- `data_type`: Data type (string, array, boolean)
- `required`: Required flag
- `optional`: Optional flag
- `validation`: Validation rules (for text fields)
- `options`: Dropdown options with `id`, `code`, and `label` (for dropdown fields)
- `format`: Time format (for time fields)
- `allow_range`: Allow time range (for time fields)
- `time_picker_config`: Time picker configuration (for time fields)
- `consent_text`: Consent text (for consent fields)

## Screen Field Definitions

### 1. Basic Screen (form)
- **name** (text): Name input field
- **age_range** (dropdown): Age range selection with 7 options
- **gender** (dropdown): Gender selection with 4 options (optional)
- **occupation** (text): Occupation input field (optional)

### 2. Lifestyle Screen (form)
- **wake_time** (time): Wake-up time picker (HH:mm format)
- **sleep_time** (time_range): Sleep time range picker (HH:mm - HH:mm format)
- **work_hours** (dropdown): Average daily work hours with 6 options
- **screen_time** (dropdown): Daily screen time with 6 options

### 3. Consent Screen (consent)
- **data_consent** (switch): Data consent toggle/switch

## API Response Transformation

The `/api/templates/onboarding` endpoint now:
1. Ensures `type` field exists (copies from `field_type` if missing)
2. Maps `time_range` to `time` for frontend compatibility
3. Adds `id` field to dropdown options if missing (uses `code` as `id`)
4. Handles None values properly

## Database State

All 11 records are properly configured:
- ✅ **basic**: 4 fields (name, age_range, gender, occupation)
- ✅ **lifestyle**: 4 fields (wake_time, sleep_time, work_hours, screen_time)
- ✅ **goals**: 4 templates, 1 field definition
- ✅ **challenges**: 8 templates, 1 field definition
- ✅ **practices**: 5 templates, 1 field definition
- ✅ **experience_levels**: 3 templates, 1 field definition
- ✅ **mood_tendencies**: 4 templates, 1 field definition
- ✅ **practice_times**: 3 templates, 1 field definition
- ✅ **reminders**: 3 templates, 1 field definition
- ✅ **interests**: 5 templates, 1 field definition
- ✅ **consent**: 1 field (data_consent switch)

## Frontend Compatibility

The field definitions are now compatible with:
- `FormFields.tsx`: Checks `field.type` ✅
- `TextField`: Uses `field.name`, `field.label`, `field.placeholder` ✅
- `Dropdown`: Uses `field.name`, `field.options` (with `id` field) ✅
- `TimePicker`: Uses `field.name`, `field.label` ✅
- `ConsentCard`: Uses consent field ✅

## Field Key Mapping

The frontend maps `field_key` to `name` using `FIELD_KEY_MAP`:
- `name` -> `name`
- `age_range` -> `ageRange`
- `gender` -> `gender`
- `occupation` -> `occupation`
- `wake_time` -> `wake`
- `sleep_time` -> `sleep`
- `work_hours` -> `workHours`
- `screen_time` -> `screenTime`

## Verification

All fields are properly structured and ready for frontend rendering:
- ✅ All form fields have `type` field
- ✅ All dropdown fields have options with `id` field
- ✅ All time fields have proper format configuration
- ✅ All fields have proper labels and placeholders
- ✅ All required/optional flags are set correctly

## Next Steps

The frontend should now be able to:
1. Fetch templates from `/api/templates/onboarding`
2. Render form fields using the `fields` array
3. Map `field_key` to `name` using `FIELD_KEY_MAP`
4. Use `field.type` to determine which component to render
5. Use `field.options` with `id` field for dropdowns
6. Use `field.label` and `field.placeholder` for display

All field definitions are complete and match the frontend implementation! ✅

