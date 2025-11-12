# Onboarding Flow Documentation

## Overview

The app now implements a smart onboarding flow that checks authentication status and onboarding progress to route users appropriately.

## Flow Diagram

```
Welcome Screen
    ↓
Click "Continue"
    ↓
Check Token?
    ├─ NO TOKEN → Breathe Screen → (1-min session) → Login Screen
    └─ HAS TOKEN → Check Onboarding Status
                    ├─ Completed → Dashboard (Main)
                    └─ Not Completed → Next Onboarding Screen
                                        (Breathe/Personalize/Sleep)
```

## Detailed Flow

### Scenario 1: New User (No Token)

1. **Welcome Screen** → User clicks "Continue"
2. **Check Token**: No token found in AsyncStorage or auth store
3. **Navigate to**: Breathe Screen
4. **Breathe Screen**: User can start 1-minute session
   - If session completes → Navigate to Login Screen
   - If user skips → Navigate to Login Screen
5. **Login Screen**: User can login or register

### Scenario 2: Returning User (Has Token)

1. **Welcome Screen** → User clicks "Continue"
2. **Check Token**: Token found in AsyncStorage or auth store
3. **API Call**: `GET /api/onboarding/status` with token
4. **Response Handling**:
   - **If `is_completed: true`**: Navigate to Dashboard (Main)
   - **If `is_completed: false`**: Navigate to `next_screen`:
     - `breathe` → Breathe Screen
     - `personalize` → Personalize Screen
     - `sleep` → Sleep Screen

## API Endpoint

### Get Onboarding Status

**Endpoint**: `GET /api/onboarding/status`

**Headers**:
```
Authorization: Bearer <backend-jwt-token>
```

**Response**:
```json
{
  "is_completed": false,
  "has_profile": true,
  "personalized_at": null,
  "completion_percentage": 40,
  "missing_fields": ["goals", "challenges"],
  "current_screen": "breathe",
  "next_screen": "personalize",
  "completed_screens": ["welcome", "breathe"],
  "onboarding_started_at": "2024-01-01T00:00:00Z"
}
```

**Response Fields**:
- `is_completed`: Boolean indicating if onboarding is complete
- `current_screen`: Current onboarding screen the user is on
- `next_screen`: Next screen the user should navigate to
- `completed_screens`: Array of screens the user has completed
- `completion_percentage`: Percentage of onboarding completed (0-100)

## Screen Navigation Map

| Backend Screen Name | Navigation Route | Screen Component |
|---------------------|------------------|------------------|
| `welcome` | `Welcome` | Welcome.tsx |
| `breathe` | `Breathe` | Breathe.tsx |
| `personalize` | `Personalize` | Personalize.tsx |
| `sleep` | `Sleep` | Sleep.tsx |
| `null` (completed) | `Main` | BottomTabs (Dashboard) |

## Implementation Details

### Welcome Screen (`Welcome.tsx`)

- **Token Check**: Checks both `useAuthStore.backendToken` and `AsyncStorage`
- **Loading State**: Shows `ActivityIndicator` while checking
- **Error Handling**: Falls back to Breathe screen if API call fails
- **Navigation**: Uses `navigation.reset()` for Dashboard, `navigation.navigate()` for onboarding screens

### Breathe Screen (`Breathe.tsx`)

- **Session Completion**: After 1-minute session completes → Navigate to Login
- **Skip Button**: Also navigates to Login
- **Audio Cleanup**: Properly stops and unloads audio when navigating away

### API Service (`api.ts`)

- **New Method**: `getOnboardingStatus(token: string)`
- **Returns**: Onboarding status response with all fields
- **Error Handling**: Throws `ApiError` if request fails

## Error Handling

### Token Not Found
- Navigate to Breathe screen (new user flow)

### API Error (401, 403, etc.)
- Token might be invalid or expired
- Navigate to Breathe screen (fallback to new user flow)

### Network Error
- Navigate to Breathe screen (fallback)

## Testing Scenarios

### Test 1: New User Flow
1. Clear app data / fresh install
2. Open app → Welcome screen
3. Click "Continue"
4. ✅ Should navigate to Breathe screen
5. Start 1-minute session
6. Wait for session to complete
7. ✅ Should navigate to Login screen

### Test 2: Returning User (Onboarding Complete)
1. Login with existing account (onboarding complete)
2. Close and reopen app
3. ✅ Should navigate directly to Dashboard (via AppNavigator)
4. If Welcome screen shows, click "Continue"
5. ✅ Should navigate to Dashboard

### Test 3: Returning User (Onboarding Incomplete)
1. Login with account that has incomplete onboarding
2. Navigate to Welcome screen
3. Click "Continue"
4. ✅ Should check onboarding status via API
5. ✅ Should navigate to appropriate onboarding screen (e.g., Personalize)

### Test 4: Invalid Token
1. Manually set invalid token in AsyncStorage
2. Open app → Welcome screen
3. Click "Continue"
4. ✅ API call should fail
5. ✅ Should navigate to Breathe screen (fallback)

## Console Logs

The implementation includes comprehensive logging:

- `📝 No token found - navigating to Breathe screen`
- `🔍 Token found - checking onboarding status`
- `📊 Onboarding status: {...}`
- `✅ Onboarding completed - navigating to Dashboard`
- `📱 Onboarding in progress - current: {...}, next: {...}`
- `🚀 Navigating to: {...}`
- `✅ 1-minute session completed - navigating to Login`
- `⏭️  Skipping session - navigating to Login`

## Future Enhancements

- [ ] Add loading overlay during onboarding status check
- [ ] Cache onboarding status to reduce API calls
- [ ] Add retry logic for failed API calls
- [ ] Show progress indicator based on `completion_percentage`
- [ ] Handle edge cases (e.g., partial onboarding data)

