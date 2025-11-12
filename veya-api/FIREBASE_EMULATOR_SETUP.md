# Firebase Emulator Setup Guide

This guide explains how to set up and use the Firebase Emulator for local development.

## Overview

The Firebase Emulator allows you to test Firebase Authentication locally without needing production credentials or making requests to Firebase servers.

## Setup

### 1. Using Docker Compose (Recommended)

The Firebase Emulator is already configured in `docker-compose.yml` but runs only when using the `dev` profile:

```bash
# Start all services including Firebase Emulator
docker-compose --profile dev up

# Or start only specific services
docker-compose up db redis firebase-emulator api
```

The emulator will be available at:
- **Auth Emulator**: `http://localhost:9099`
- **Emulator UI**: `http://localhost:4000`

### 2. Manual Setup (Local Development)

If you prefer to run the emulator locally:

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Set environment variable:
```bash
export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
```

3. Start the emulator:
```bash
firebase emulators:start --only auth --project demo-veya
```

4. Run your API:
```bash
# The API will automatically detect and use the emulator
uvicorn app.main:app --reload
```

## Configuration

### Environment Variables

- `FIREBASE_AUTH_EMULATOR_HOST`: Set to `localhost:9099` (or `firebase-emulator:9099` in Docker) to enable emulator mode
- When this variable is set, the API will automatically use the emulator instead of production Firebase

### Docker Compose

The Firebase Emulator service is configured with:
- **Auth Port**: 9099 (maps to host port 9099)
- **UI Port**: 4000 (maps to host port 4000)
- **Project ID**: `demo-veya` (can be changed in docker-compose.yml)

## Using the Emulator

### 1. Create Test Users

You can create test users directly in the emulator UI at `http://localhost:4000`:
- Navigate to Authentication
- Add users manually
- Set custom claims and properties

### 2. Generate ID Tokens

For testing, you can use the Firebase Admin SDK or REST API to generate ID tokens:

```python
# Example: Generate token for a test user
import firebase_admin
from firebase_admin import auth
import os

# Set emulator host
os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = "localhost:9099"

# Initialize Firebase (will use emulator)
firebase_admin.initialize_app()

# Create a test user
user = auth.create_user(
    email="test@example.com",
    password="test123",
    display_name="Test User"
)

# Generate a custom token (then exchange for ID token on client)
custom_token = auth.create_custom_token(user.uid)
```

### 3. Frontend Integration

In your React Native app, configure Firebase to use the emulator:

```typescript
// For development only
if (__DEV__) {
  auth().useEmulator('http://localhost:9099');
}
```

**Note**: For Android emulator, use `http://10.0.2.2:9099` instead of `localhost:9099`.

## Test User Script

Use the provided script to create a test user with a JWT token (works with or without Firebase Emulator):

```bash
# First, run migration to add name fields (if not already done)
python scripts/add_user_name_fields.py

# Create test user
python scripts/create_test_user.py
```

Or if running in Docker:

```bash
# Run migration
docker-compose exec api python scripts/add_user_name_fields.py

# Create test user
docker-compose exec api python scripts/create_test_user.py
```

This will create a user with:
- Email: `khoinguyent@gmail.com`
- Firstname: `To`
- Lastname: `Nguyen`
- Nickname: `Kyan`

And generate a JWT token that you can use to bypass login in the frontend. The token is saved to `test_user_token.txt` in the project root.

**Note**: This test user is created directly in your database and does not require Firebase. You can use the JWT token directly for authentication, bypassing Firebase login.

## API Endpoints

When using the emulator, the authentication endpoints work the same way:

- `POST /api/auth/firebase` - Authenticate with Firebase ID token
- `POST /api/auth/guest` - Create guest user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/refresh` - Refresh JWT token

## Troubleshooting

### Emulator Not Starting

1. Check if ports 9099 and 4000 are available:
```bash
lsof -i :9099
lsof -i :4000
```

2. Check Docker logs:
```bash
docker-compose logs firebase-emulator
```

### API Not Connecting to Emulator

1. Verify environment variable is set:
```bash
echo $FIREBASE_AUTH_EMULATOR_HOST
```

2. Check API logs for Firebase initialization messages

3. Ensure the emulator is running before starting the API

### Token Verification Failing

- Make sure the emulator is running
- Verify the `FIREBASE_AUTH_EMULATOR_HOST` environment variable is set correctly
- Check that tokens are generated from the emulator, not production Firebase

## Production

**Important**: The Firebase Emulator is for development only. In production:
- Remove or disable the emulator service
- Set up proper Firebase credentials
- Remove `FIREBASE_AUTH_EMULATOR_HOST` environment variable
- Use production Firebase project credentials

## Additional Resources

- [Firebase Emulator Suite Documentation](https://firebase.google.com/docs/emulator-suite)
- [Firebase Auth Emulator Guide](https://firebase.google.com/docs/emulator-suite/connect_auth)
- [Firebase Admin SDK for Python](https://firebase.google.com/docs/admin/setup)

