# Creating Test Users in Firebase Emulator

## Quick Solution

The easiest way to create a test user is through the **Firebase Emulator UI**:

1. **Open Firebase Emulator UI**: http://localhost:4000
2. **Go to Authentication tab**
3. **Click "Add user"** or use the UI to create a user with:
   - Email: `khoinguyent@gmail.com`
   - Password: `test123`
   - Display Name: (optional)

## Alternative: Using Node.js Script

If you want to automate user creation, you can use the test script:

### Install Firebase Admin SDK (if not already installed):
```bash
cd veya-app
npm install firebase-admin --save-dev
```

### Create/Update User:
```bash
node scripts/test-firebase-auth.js create khoinguyent@gmail.com test123 "Test User"
```

### List All Users:
```bash
node scripts/test-firebase-auth.js list
```

### Reset User (delete and recreate):
```bash
node scripts/test-firebase-auth.js reset khoinguyent@gmail.com test123 "Test User"
```

## Manual Method: Using curl

You can also use curl to interact with Firebase Emulator REST API:

### Create User:
```bash
curl -X POST http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "email": "khoinguyent@gmail.com",
    "password": "test123",
    "returnSecureToken": true
  }'
```

### Sign In (test):
```bash
curl -X POST http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key \
  -H "Content-Type: application/json" \
  -d '{
    "email": "khoinguyent@gmail.com",
    "password": "test123",
    "returnSecureToken": true
  }'
```

## Troubleshooting

### User Already Exists
If the user already exists with a different password:
1. Use Firebase Emulator UI to delete the user
2. Create a new user with the correct password
3. Or use the reset command: `node scripts/test-firebase-auth.js reset khoinguyent@gmail.com test123`

### Password Requirements
Firebase Auth requires passwords to be at least 6 characters. The password "test123" meets this requirement.

### Emulator Not Running
Make sure Firebase Emulator is running:
```bash
cd veya-api
docker-compose --profile dev ps firebase-emulator
```

If not running:
```bash
docker-compose --profile dev up -d firebase-emulator
```

