# Personalization Onboarding API Verification

## ✅ Verified APIs

The following APIs exist and are working for updating personalization onboarding data:

### 1. **POST /api/users/me/profile** - Create or Update Personalization Profile

**Description**: Create or update user's personalization profile with onboarding data.

**Authentication**: Required (Bearer token)

**Request Body** (`UserProfileUpdate`):
```json
{
  // Basic Info
  "name": "John Doe",
  "age_range": "18-24",
  "gender": "male",
  "occupation": "student",
  
  // Lifestyle
  "wake_time": "07:00",
  "sleep_time": "23:00",
  "work_hours": "4_6",
  "screen_time": "4_6",
  
  // Personalization Preferences (arrays of template codes)
  "goals": ["reduce_stress", "sleep_better", "improve_focus"],
  "challenges": ["overthinking", "burnout", "anxiety"],
  "practice_preferences": ["breathing", "guided_meditation", "soundscape"],
  "interests": ["mindfulness", "sleep_science", "productivity"],
  "reminder_times": ["morning", "evening"],
  
  // Experience
  "experience_level": "beginner",
  "mood_tendency": "stressed",
  "preferred_practice_time": "morning",
  
  // Consent
  "data_consent": true,
  "marketing_consent": false,
  
  // Onboarding Progress
  "onboarding_screen": "personalize"  // "welcome", "breathe", "personalize", "sleep"
}
```

**Response**: `UserProfileResponse`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "John Doe",
  "goals": ["reduce_stress", "sleep_better"],
  "challenges": ["overthinking"],
  "practice_preferences": ["breathing"],
  "onboarding_screen": "personalize",
  "onboarding_started_at": "2025-11-07T16:00:00Z",
  "personalized_at": null,
  "created_at": "2025-11-07T16:00:00Z",
  "updated_at": "2025-11-07T16:00:00Z",
  ...
}
```

**Features**:
- Creates profile if it doesn't exist
- Updates existing profile if it exists
- Validates template codes (goals, challenges, practice_preferences, etc.)
- Automatically sets `onboarding_started_at` if not set
- Sets `personalized_at` when onboarding is completed (screen = "sleep" and required fields filled)
- Handles partial updates (only send fields you want to update)

### 2. **PUT /api/users/me/profile** - Update Personalization Profile

**Description**: Update user's personalization profile (profile must exist).

**Authentication**: Required (Bearer token)

**Request Body**: Same as POST `/api/users/me/profile`

**Response**: `UserProfileResponse`

**Features**:
- Requires existing profile (returns 404 if profile doesn't exist)
- Validates template codes
- Updates only provided fields
- Sets `personalized_at` when onboarding is completed

### 3. **POST /api/onboarding/screen** - Update Onboarding Screen

**Description**: Update the current onboarding screen the user is on (for progress tracking).

**Authentication**: Required (Bearer token)

**Request Body**:
```json
{
  "screen": "personalize"  // "welcome", "breathe", "personalize", "sleep"
}
```

**Response**:
```json
{
  "message": "Onboarding screen updated",
  "current_screen": "personalize",
  "onboarding_started_at": "2025-11-07T16:00:00Z"
}
```

**Features**:
- Creates profile if it doesn't exist
- Updates `onboarding_screen` field
- Sets `onboarding_started_at` if not set
- Validates screen names

## 📋 All Available Fields

The following fields can be updated via the personalization APIs:

### Basic Info
- `name` (string) - User's name
- `age_range` (string) - Age range (e.g., "13-17", "18-24", "25-34")
- `gender` (string) - Gender (e.g., "male", "female", "non_binary", "prefer_not_say")
- `occupation` (string) - Occupation

### Lifestyle & Routine
- `wake_time` (string) - Wake time (e.g., "07:00" or time range)
- `sleep_time` (string) - Sleep time (e.g., "23:00" or time range)
- `work_hours` (string) - Work hours (e.g., "under_4", "4_6", "6_8", "over_8")
- `screen_time` (string) - Screen time (e.g., "under_2", "2_4", "4_6", "over_6")

### Personalization Preferences (JSONB arrays)
- `goals` (List[str]) - Array of goal template codes (e.g., ["reduce_stress", "sleep_better"])
- `challenges` (List[str]) - Array of challenge template codes (e.g., ["overthinking", "burnout"])
- `practice_preferences` (List[str]) - Array of practice preference codes (e.g., ["breathing", "guided_meditation"])
- `interests` (List[str]) - Array of interest codes (e.g., ["mindfulness", "sleep_science"])
- `reminder_times` (List[str]) - Array of reminder time codes (e.g., ["morning", "evening"])

### Experience & Mood
- `experience_level` (string) - Experience level (e.g., "beginner", "intermediate", "advanced")
- `mood_tendency` (string) - Mood tendency (e.g., "calm", "stressed", "sad", "happy")
- `preferred_practice_time` (string) - Preferred practice time (e.g., "morning", "afternoon", "night")

### Consent
- `data_consent` (boolean) - Consent for data usage for personalization
- `marketing_consent` (boolean) - Consent for marketing communications

### Onboarding Progress
- `onboarding_screen` (string) - Current onboarding screen: "welcome", "breathe", "personalize", "sleep"

## 🔍 Related APIs

### Get Profile
- **GET /api/users/me/profile** - Get current user's personalization profile

### Get Onboarding Status
- **GET /api/users/me/onboarding/status** - Check onboarding completion status
- **GET /api/onboarding/status** - Alias for the above endpoint

## 📝 Example Usage

### Update Personalization Data

```bash
curl -X POST "http://localhost:8000/api/users/me/profile" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "goals": ["reduce_stress", "sleep_better"],
    "challenges": ["overthinking"],
    "practice_preferences": ["breathing"],
    "interests": ["mindfulness"],
    "onboarding_screen": "personalize"
  }'
```

### Update Onboarding Screen Only

```bash
curl -X POST "http://localhost:8000/api/onboarding/screen" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "screen": "sleep"
  }'
```

### Get Current Profile

```bash
curl -X GET "http://localhost:8000/api/users/me/profile" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Onboarding Status

```bash
curl -X GET "http://localhost:8000/api/users/me/onboarding/status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ✅ Verification Status

- ✅ **POST /api/users/me/profile** - Verified (creates/updates profile)
- ✅ **PUT /api/users/me/profile** - Verified (updates existing profile)
- ✅ **POST /api/onboarding/screen** - Verified (updates onboarding screen)
- ✅ Template code validation - Verified (invalid codes are filtered out)
- ✅ Automatic completion tracking - Verified (sets `personalized_at` when completed)
- ✅ Partial updates - Verified (only update fields you send)

## 🎯 Summary

**Yes, there are APIs to update personalization onboarding data:**

1. **POST /api/users/me/profile** - Main API for creating/updating personalization data
2. **PUT /api/users/me/profile** - Update existing profile
3. **POST /api/onboarding/screen** - Update onboarding screen progress

All APIs:
- Require authentication (Bearer token)
- Support partial updates
- Validate template codes
- Track onboarding progress automatically
- Handle both create and update scenarios

