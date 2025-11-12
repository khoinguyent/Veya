# Authentication & Authorization Guide

## Overview

The Veya API supports multiple authentication methods:
- **Firebase Authentication** - For Google, Apple, and email/password (via Firebase)
- **Guest Authentication** - For anonymous users
- **JWT Tokens** - For API authorization after authentication

## Architecture

### Authentication Flow

1. **Client authenticates with Firebase** (Google, Apple, or email/password)
2. **Client receives Firebase ID token** from Firebase SDK
3. **Client sends Firebase ID token to API** (`POST /api/auth/firebase`)
4. **API verifies Firebase token** and creates/updates user
5. **API returns JWT token** for subsequent API requests
6. **Client uses JWT token** in `Authorization: Bearer <token>` header

### User Model Structure

```
User
├── Basic Info (email, username, display_name, avatar_url)
├── Firebase UID (for Firebase auth)
├── Auth Provider (guest, email, google, apple, firebase)
├── UserProfile (personalization data from onboarding)
└── SocialAccounts (linked OAuth accounts)
```

## API Endpoints

### Authentication

#### `POST /api/auth/firebase`
Authenticate with Firebase ID token.

**Request:**
```json
{
  "id_token": "firebase_id_token_here",
  "provider": "google"  // or "apple", "firebase"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_verified": true,
    "display_name": "John Doe",
    "avatar_url": "https://...",
    "is_guest": false,
    "auth_provider": "google",
    ...
  },
  "token": "jwt_token_here",
  "is_new_user": false
}
```

#### `POST /api/auth/guest`
Create a guest user account.

**Response:**
```json
{
  "user_id": "uuid",
  "token": "jwt_token_here",
  "user": { ... }
}
```

#### `GET /api/auth/me`
Get current authenticated user info (requires JWT token).

#### `POST /api/auth/refresh`
Refresh JWT token (requires JWT token).

### Social Account Linking

#### `POST /api/auth/social/link`
Link a social account to current user.

**Request:**
```json
{
  "provider": "google",
  "provider_account_id": "google_user_id",
  "provider_email": "user@gmail.com",
  "access_token": "...",
  "refresh_token": "...",
  "expires_at": "2024-01-01T00:00:00Z"
}
```

#### `GET /api/auth/social/accounts`
Get all linked social accounts.

#### `DELETE /api/auth/social/accounts/{account_id}`
Unlink a social account.

### User Profile

#### `GET /api/users/me`
Get current user with full profile.

#### `PUT /api/users/me`
Update user basic info (display_name, avatar_url, username).

#### `GET /api/users/me/profile`
Get user personalization profile.

#### `POST /api/users/me/profile`
Create or update user personalization profile (onboarding data).

**Request:**
```json
{
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
}
```

#### `PUT /api/users/me/profile`
Update user personalization profile.

## Usage Examples

### 1. Firebase Authentication (Google/Apple)

```python
# Client-side (React Native with Firebase)
import auth from '@react-native-firebase/auth';

// Sign in with Google
const googleCredential = await GoogleSignin.signIn();
const firebaseCredential = auth.GoogleAuthProvider.credential(googleCredential.idToken);
const userCredential = await auth().signInWithCredential(firebaseCredential);
const idToken = await userCredential.user.getIdToken();

// Send to API
const response = await fetch('https://api.veya.com/api/auth/firebase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id_token: idToken,
    provider: 'google'
  })
});

const { token, user } = await response.json();

// Store JWT token for API requests
await AsyncStorage.setItem('auth_token', token);
```

### 2. Using JWT Token for API Requests

```python
# All authenticated endpoints
const token = await AsyncStorage.getItem('auth_token');

const response = await fetch('https://api.veya.com/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const userData = await response.json();
```

### 3. Complete Onboarding Flow

```python
// 1. Authenticate with Firebase
const authResponse = await authenticateWithFirebase(idToken);

// 2. Save user profile data
const profileResponse = await fetch('https://api.veya.com/api/users/me/profile', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authResponse.token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "John Doe",
    age_range: "25-34",
    goals: ["reduce_stress", "sleep_better"],
    // ... other personalization data
  })
});
```

## Firebase Setup

### 1. Install Firebase Admin SDK

The API uses `firebase-admin` to verify Firebase ID tokens.

### 2. Set Up Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Download the JSON file
4. Set environment variable:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
   ```
   Or set in `.env`:
   ```bash
   FIREBASE_CREDENTIALS_PATH=/path/to/service-account-key.json
   ```

### 3. Enable Authentication Providers

In Firebase Console → Authentication:
- Enable Google Sign-In
- Enable Apple Sign-In
- Enable Email/Password (if using)

## JWT Token Structure

JWT tokens contain:
```json
{
  "sub": "user_uuid",
  "exp": 1234567890
}
```

- `sub`: User ID (subject)
- `exp`: Expiration timestamp

Token expiration: 7 days (configurable via `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`)

## Security Considerations

1. **Firebase Token Verification**: Always verify Firebase ID tokens server-side
2. **JWT Secret**: Use a strong secret key in production (`JWT_SECRET_KEY`)
3. **HTTPS Only**: Always use HTTPS in production
4. **Token Storage**: Store JWT tokens securely (e.g., secure storage in mobile apps)
5. **Token Refresh**: Implement token refresh logic for long sessions
6. **Account Linking**: Users can link multiple social accounts to one account

## Migration from Guest to Authenticated

1. User starts as guest
2. User authenticates with Firebase
3. API links Firebase account to guest account (by email if available)
4. User profile is preserved

## Error Handling

### 401 Unauthorized
- Invalid or expired JWT token
- Missing Authorization header
- User not found

### 400 Bad Request
- Invalid Firebase token
- Missing required fields
- Username already taken

### 404 Not Found
- User profile not found
- Social account not found

## Testing

### Test Firebase Authentication

```bash
# Get Firebase ID token (from client app)
# Then test API endpoint
curl -X POST http://localhost:8000/api/auth/firebase \
  -H "Content-Type: application/json" \
  -d '{
    "id_token": "your_firebase_id_token",
    "provider": "google"
  }'
```

### Test JWT Authentication

```bash
# Use JWT token from Firebase auth response
curl -X GET http://localhost:8000/api/users/me \
  -H "Authorization: Bearer your_jwt_token"
```

