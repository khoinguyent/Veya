# Firebase Test User

## User Credentials

- **Email**: `khoinguyent@gmail.com`
- **Password**: `test123456` (for Firebase Auth)
- **Firebase UID**: `3SFbs7HUdXVQAqoqFHmlqKJR2Hlu`
- **Firstname**: `To`
- **Lastname**: `Nguyen`
- **Nickname**: `Kyan`

## Authentication Methods

### 1. Firebase Authentication

The user is registered in Firebase Auth (emulator) and can login using Firebase ID tokens.

**To login:**
1. Get Firebase ID token from frontend (after Firebase sign-in)
2. Call `/api/auth/firebase/login` or `/api/auth/firebase/register` with the token
3. Backend will verify the token and return a JWT token

### 2. Email/Password (Direct)

The user also has a password set in the database for direct email/password authentication.

**To login:**
- Use `/api/auth/login` with email and password

## JWT Token

The JWT token for this user is saved in `firebase_test_user_token.txt`.

Use this token for authenticated API requests:
```
Authorization: Bearer <token>
```

## Testing

### Test Firebase Login

```bash
# 1. Get Firebase ID token (from frontend after Firebase sign-in)
# 2. Register/Login with Firebase token
curl -X POST http://localhost:8000/api/auth/firebase/register \
  -H "Content-Type: application/json" \
  -d '{
    "id_token": "<firebase-id-token>",
    "provider": "firebase"
  }'
```

### Test Email/Password Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "khoinguyent@gmail.com",
    "password": "test123"
  }'
```

## Recreating the User

To recreate the Firebase test user:

```bash
docker-compose exec api python scripts/create_firebase_test_user.py
```

This will:
1. Create user in Firebase Auth (emulator)
2. Get Firebase ID token
3. Register user in backend database
4. Store Firebase UID in user record
5. Generate JWT token

## Notes

- The user exists in both Firebase Auth (emulator) and the backend database
- The Firebase UID is stored in the `firebase_uid` field of the `users` table
- The user can authenticate using either Firebase tokens or email/password
- For production, use production Firebase credentials instead of emulator

