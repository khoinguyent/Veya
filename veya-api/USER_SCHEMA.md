# User Schema Documentation

## Database Schema

### Users Table

Stores user authentication and basic information.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `firebase_uid` | String (nullable) | Firebase user UID (unique) |
| `email` | String (nullable) | User email (unique) |
| `email_verified` | Boolean | Email verification status |
| `username` | String (nullable) | Username (unique) |
| `is_guest` | Boolean | Is guest user |
| `auth_provider` | Enum | Authentication provider (guest, email, google, apple, firebase) |
| `password_hash` | String (nullable) | Hashed password (for email/password auth) |
| `display_name` | String (nullable) | Display name |
| `avatar_url` | String (nullable) | Avatar image URL |
| `is_active` | Boolean | Account active status |
| `is_superuser` | Boolean | Admin user flag |
| `created_at` | DateTime | Account creation time |
| `updated_at` | DateTime (nullable) | Last update time |
| `last_login_at` | DateTime (nullable) | Last login time |

### User Profiles Table

Stores personalization data from onboarding.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users (unique) |
| `personalization_data` | JSONB | Map of personalization answers keyed by `field_key` (e.g. `name`, `age_range`, `goals`, `data_consent`). Stores strings, arrays, and booleans returned by onboarding. |
| `timezone` | String | IANA timezone identifier (default `UTC`) used for greetings and scheduling |
| `onboarding_screen` | String (nullable) | Current onboarding screen (`welcome`, `breathe`, `personalize`, `sleep`) |
| `onboarding_started_at` | DateTime (nullable) | When the user started onboarding |
| `created_at` | DateTime | Profile creation time |
| `updated_at` | DateTime (nullable) | Last update time |
| `personalized_at` | DateTime (nullable) | Onboarding completion time |

**Personalization Data Keys**

The `personalization_data` JSON map stores dynamic answers returned from onboarding. Common keys include:

- `name`, `age_range`, `gender`, `occupation`
- `wake_time`, `sleep_time`, `work_hours`, `screen_time`
- `goals`, `challenges`, `practice_preferences`, `interests`, `reminder_times`
- `experience_level`, `mood_tendency`, `preferred_practice_time`
- `data_consent`, `marketing_consent`

Each key aligns with the field definitions served from `/api/templates/onboarding` and can grow over time without schema changes.

### Social Accounts Table

Stores linked OAuth accounts.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| `provider` | Enum | Provider (google, apple) |
| `provider_account_id` | String | Provider user ID |
| `provider_email` | String (nullable) | Provider email |
| `access_token` | String (nullable) | Encrypted access token |
| `refresh_token` | String (nullable) | Encrypted refresh token |
| `expires_at` | DateTime (nullable) | Token expiration |
| `created_at` | DateTime | Link creation time |
| `updated_at` | DateTime (nullable) | Last update time |

## Data Enums

### AuthProvider
- `guest` - Guest user
- `email` - Email/password authentication
- `google` - Google Sign-In
- `apple` - Apple Sign-In
- `firebase` - Firebase authentication

### Age Ranges
- `13-17`
- `18-24`
- `25-34`
- `35-44`
- `45-54`
- `55-64`
- `65+`

### Genders
- `male`
- `female`
- `non_binary`
- `prefer_not_say`

### Work Hours
- `under_4` - Under 4 hours
- `4_6` - 4-6 hours
- `6_8` - 6-8 hours
- `8_10` - 8-10 hours
- `10_12` - 10-12 hours
- `over_12` - Over 12 hours

### Screen Time
- `under_2` - Under 2 hours
- `2_4` - 2-4 hours
- `4_6` - 4-6 hours
- `6_8` - 6-8 hours
- `8_10` - 8-10 hours
- `over_10` - Over 10 hours

### Goals (examples)
- `reduce_stress`
- `sleep_better`
- `improve_focus`
- `manage_emotions`

### Challenges (examples)
- `overthinking`
- `burnout`
- `fatigue`
- `insomnia`
- `low_motivation`
- `loneliness`
- `relationship_stress`
- `anxiety`

### Practice Preferences (examples)
- `breathing`
- `guided_meditation`
- `soundscape`
- `short_reflections`
- `mindful_journaling`

### Experience Levels
- `beginner`
- `intermediate`
- `advanced`

### Mood Tendencies
- `calm`
- `stressed`
- `sad`
- `happy`

### Practice Times
- `morning`
- `afternoon`
- `night`

### Reminder Times
- `morning` - Morning check-in
- `midday` - Midday break
- `evening` - Evening reflection

### Interests (examples)
- `mindfulness`
- `sleep_science`
- `productivity`
- `relationships`
- `self_compassion`

## Relationships

- **User** → **UserProfile** (One-to-One)
- **User** → **SocialAccount** (One-to-Many)
- **User** → **ProgressSession** (One-to-Many)
- **User** → **MoodEntry** (One-to-Many)

## Example Data

### User
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "firebase_uid": "firebase_uid_123",
  "email": "user@example.com",
  "email_verified": true,
  "username": "johndoe",
  "is_guest": false,
  "auth_provider": "google",
  "display_name": "John Doe",
  "avatar_url": "https://...",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-02T00:00:00Z",
  "last_login_at": "2024-01-02T00:00:00Z"
}
```

### UserProfile
```json
{
  "id": "223e4567-e89b-12d3-a456-426614174000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "personalization_data": {
    "name": "John Doe",
    "age_range": "25-34",
    "gender": "male",
    "occupation": "Software Developer",
    "wake_time": "07:00",
    "sleep_time": "23:00",
    "work_hours": "6_8",
    "screen_time": "4_6",
    "goals": ["reduce_stress", "sleep_better"],
    "challenges": ["overthinking", "anxiety"],
    "practice_preferences": ["breathing", "guided_meditation"],
    "experience_level": "intermediate",
    "mood_tendency": "calm",
    "preferred_practice_time": "morning",
    "reminder_times": ["morning", "evening"],
    "interests": ["mindfulness", "sleep_science"],
    "data_consent": true,
    "marketing_consent": false
  },
  "onboarding_screen": "sleep",
  "onboarding_started_at": "2024-01-01T00:00:00Z",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "personalized_at": "2024-01-01T00:00:00Z"
}
```

## Indexes

- `users.firebase_uid` (unique)
- `users.email` (unique)
- `users.username` (unique)
- `user_profiles.user_id` (unique)
- `social_accounts.user_id`
- `social_accounts.provider`
- `social_accounts.provider_account_id`

