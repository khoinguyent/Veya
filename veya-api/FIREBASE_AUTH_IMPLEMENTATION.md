# Firebase Authentication Implementation

This document describes the secure backend implementation for verifying Firebase ID Tokens and managing user profiles.

## Overview

The backend uses **FastAPI** (Python) with **Firebase Admin SDK** to securely verify Firebase ID tokens received from the frontend. The implementation creates or fetches user profiles in the PostgreSQL database.

## Architecture

```
Frontend (React Native/Web)
    ↓
    Sends Firebase ID Token
    ↓
Backend API (FastAPI)
    ↓
    Verifies Token with Firebase Admin SDK
    ↓
    Creates/Updates User in Database
    ↓
    Returns JWT Token + User Info
```

## Security Features

✅ **Server-side token verification** - Firebase ID tokens are verified on the backend, not the frontend
✅ **Token expiration checking** - Expired tokens are rejected
✅ **User profile creation** - Automatic user profile creation with proper data validation
✅ **JWT token generation** - Secure JWT tokens for subsequent API requests
✅ **Account linking** - Links Firebase accounts to existing email accounts
✅ **Firebase Emulator support** - Works with Firebase Emulator for development

## Endpoints

### 1. Register with Firebase

**Endpoint**: `POST /api/auth/firebase/register`

Creates a new user in the database if they don't exist, or returns the existing user.

**Request**:
```json
{
  "id_token": "firebase-id-token-here",
  "provider": "firebase"  // optional, defaults to "firebase"
}
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "firebase_uid": "firebase-uid",
    "email": "user@example.com",
    "email_verified": true,
    "display_name": "John Doe",
    "avatar_url": "https://...",
    "is_guest": false,
    "auth_provider": "firebase",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00",
    "last_login_at": "2024-01-01T00:00:00"
  },
  "token": "jwt-token-here",
  "is_new_user": true
}
```

### 2. Login with Firebase

**Endpoint**: `POST /api/auth/firebase/login`

Returns user profile if user exists. Returns 404 if user doesn't exist (use `/register` instead).

**Request**:
```json
{
  "id_token": "firebase-id-token-here",
  "provider": "firebase"  // optional
}
```

**Response**: Same as register endpoint, but `is_new_user` will be `false`.

### 3. Firebase Authentication (Legacy/Unified)

**Endpoint**: `POST /api/auth/firebase`

Unified endpoint that handles both registration and login. Automatically creates user if doesn't exist.

**Request**: Same as above

**Response**: Same as above

## Implementation Details

### Firebase Admin SDK Setup

The Firebase Admin SDK is initialized in `app/core/firebase.py`:

```python
def initialize_firebase():
    """Initialize Firebase Admin SDK."""
    # Supports both production Firebase and Firebase Emulator
    # Automatically detects FIREBASE_AUTH_EMULATOR_HOST for development
```

### Token Verification

Tokens are verified using Firebase Admin SDK:

```python
def verify_firebase_token(id_token: str) -> Optional[dict]:
    """
    Verify Firebase ID token and return decoded token.
    Returns None if token is invalid or expired.
    """
    decoded_token = auth.verify_id_token(id_token)
    return decoded_token  # Contains: uid, email, name, picture, etc.
```

### User Profile Creation

When a new user registers:
1. Firebase token is verified
2. User record is created in `users` table
3. User profile is created in `user_profiles` table
4. JWT token is generated for API authentication
5. User info and token are returned to client

## Frontend Integration

### React Native Example

```typescript
import auth from '@react-native-firebase/auth';

// Get Firebase ID token
const getIdToken = async () => {
  const user = auth().currentUser;
  if (user) {
    const token = await user.getIdToken();
    return token;
  }
  return null;
};

// Register/Login with Firebase
const registerWithFirebase = async () => {
  try {
    const idToken = await getIdToken();
    
    const response = await fetch('http://localhost:8000/api/auth/firebase/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_token: idToken,
        provider: 'firebase'
      }),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();
    
    // Store JWT token
    await AsyncStorage.setItem('auth_token', data.token);
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login with Firebase
const loginWithFirebase = async () => {
  try {
    const idToken = await getIdToken();
    
    const response = await fetch('http://localhost:8000/api/auth/firebase/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id_token: idToken,
        provider: 'firebase'
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        // User doesn't exist, redirect to registration
        return await registerWithFirebase();
      }
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    // Store JWT token
    await AsyncStorage.setItem('auth_token', data.token);
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### Web Example (React)

```typescript
import { getAuth } from 'firebase/auth';

const registerWithFirebase = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const idToken = await user.getIdToken();
  
  const response = await fetch('http://localhost:8000/api/auth/firebase/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id_token: idToken,
      provider: 'firebase'
    }),
  });

  const data = await response.json();
  localStorage.setItem('auth_token', data.token);
  
  return data;
};
```

## Configuration

### Environment Variables

Set these in your `.env` file or deployment platform:

```bash
# Firebase (Production)
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-service-account.json
FIREBASE_PROJECT_ID=your-firebase-project-id

# OR use Google Application Credentials
GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json

# Firebase Emulator (Development)
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

### Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Set `FIREBASE_CREDENTIALS_PATH` to the file path, or
5. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

## Error Handling

### Invalid Token
```json
{
  "detail": "Invalid or expired Firebase token"
}
```
**Status**: 401 Unauthorized

### User Not Found (Login endpoint)
```json
{
  "detail": "User not found. Please register first."
}
```
**Status**: 404 Not Found

### Inactive Account
```json
{
  "detail": "User account is inactive"
}
```
**Status**: 403 Forbidden

## Security Best Practices

1. **Always verify tokens server-side** - Never trust client-side token validation
2. **Use HTTPS in production** - Encrypt all communication
3. **Validate token expiration** - Reject expired tokens
4. **Store JWT tokens securely** - Use secure storage (not localStorage in web)
5. **Implement token refresh** - Refresh tokens before expiration
6. **Rate limiting** - Implement rate limiting on auth endpoints
7. **Monitor failed attempts** - Log and monitor authentication failures

## Testing

### Using Firebase Emulator

1. Start Firebase Emulator:
```bash
docker-compose --profile dev up firebase-emulator
```

2. Configure frontend to use emulator:
```typescript
if (__DEV__) {
  auth().useEmulator('http://localhost:9099');
}
```

3. Test registration/login endpoints with emulator tokens

### Test with cURL

```bash
# First, get a Firebase ID token from your frontend
# Then test the endpoint:
curl -X POST http://localhost:8000/api/auth/firebase/register \
  -H "Content-Type: application/json" \
  -d '{
    "id_token": "your-firebase-id-token",
    "provider": "firebase"
  }'
```

## Database Schema

### Users Table
- `id` (UUID) - Primary key
- `firebase_uid` (string) - Firebase user UID (unique, indexed)
- `email` (string) - User email
- `email_verified` (boolean) - Email verification status
- `display_name` (string) - User display name
- `avatar_url` (string) - User avatar URL
- `auth_provider` (enum) - Authentication provider
- `is_active` (boolean) - User active status
- `created_at` (datetime) - Account creation time
- `last_login_at` (datetime) - Last login time

### User Profiles Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users table
- `name` (string) - User's name
- Additional personalization fields...

## Comparison with Express.js Implementation

| Feature | Express.js (Node) | FastAPI (Python) |
|---------|------------------|------------------|
| Framework | Express | FastAPI |
| Firebase SDK | firebase-admin | firebase-admin (Python) |
| Token Verification | `admin.auth().verifyIdToken()` | `auth.verify_id_token()` |
| Database | Mock Map (example) | PostgreSQL + SQLModel |
| Error Handling | try/catch | HTTPException |
| Response Format | Express response | Pydantic models |

## Files

- `app/core/firebase.py` - Firebase Admin SDK setup and token verification
- `app/api/routes/auth.py` - Authentication endpoints
- `app/models/user.py` - User database models
- `app/schemas/user.py` - Request/response schemas

## Related Documentation

- [Firebase Emulator Setup](./FIREBASE_EMULATOR_SETUP.md)
- [Authentication Guide](./AUTHENTICATION.md)
- [Login API](./LOGIN_API.md)

