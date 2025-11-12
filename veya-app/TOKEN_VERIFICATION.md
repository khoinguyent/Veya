# Token Verification Guide

## 🔍 Understanding Token Types

The Veya app uses **two different authentication systems**:

### 1. **Backend JWT Tokens** (Currently Used for Email/Password Login)
- **Source**: Backend API (`/api/auth/login`)
- **Storage**: AsyncStorage + Zustand store
- **Type**: JWT (JSON Web Token) issued by your FastAPI backend
- **Not visible in Firebase Emulator**: These are backend tokens, not Firebase tokens

### 2. **Firebase Auth Tokens** (For Social Login)
- **Source**: Firebase Auth
- **Storage**: Firebase Auth + AsyncStorage
- **Type**: Firebase ID Token
- **Visible in Firebase Emulator**: Yes, at `http://localhost:4000`

## ✅ How to Verify Backend JWT Tokens

Since you're using email/password login with backend JWT tokens, here's how to verify they're being issued:

### Method 1: Check Console Logs

When you log in, you should see these logs in your Expo/React Native console:

```
🌐 API Request: POST http://localhost:8000/api/auth/login
✅ API Success: POST http://localhost:8000/api/auth/login
✅ Login successful!
📦 Token received: eyJhbGciOiJIUzI1NiIs...
👤 User: { id: '...', email: '...', ... }
✅ Token stored successfully in auth store
🔑 Stored token (first 20 chars): eyJhbGciOiJIUzI1NiIs...
🔓 Decoded JWT Token:
  - User ID (sub): <user-id>
  - Expires (exp): 2025-11-14T15:36:49.000Z
  - Issued (iat): 2025-11-07T15:36:49.000Z
  - Full payload: { ... }
🔍 === Auth Debug Info ===
📦 Token in AsyncStorage: eyJhbGciOiJIUzI1NiIs...
👤 User in AsyncStorage: { ... }
🏪 Auth Store State:
  - Token: eyJhbGciOiJIUzI1NiIs...
  - User: { ... }
  - Is Authenticated: true
  - Is Loading: false
  - Firebase User: null
======================
```

### Method 2: Use Debug Utility in Console

In your React Native debugger console, you can run:

```javascript
// Check stored token
await debugAuth.checkStoredToken();

// Decode a specific token
debugAuth.decodeToken('your-token-here');

// Clear auth data (for testing)
await debugAuth.clearAuth();
```

### Method 3: Check Backend Logs

Check your backend API logs (docker-compose or uvicorn) for login requests:

```bash
# If using docker-compose
docker-compose logs -f api

# You should see:
# INFO: POST /api/auth/login
# INFO: User authenticated: <email>
# INFO: Token issued for user: <user-id>
```

### Method 4: Verify Token in AsyncStorage

You can inspect AsyncStorage directly (requires React Native debugger or Flipper):

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// In your app console
const token = await AsyncStorage.getItem('@veya:token');
console.log('Token:', token);
```

## 🔥 Why Firebase Emulator Shows Nothing

The Firebase Emulator UI (`http://localhost:4000`) only shows:
- **Firebase Auth users** (created via Firebase Auth)
- **Firebase ID tokens** (issued by Firebase)

Since email/password login uses:
- **Backend database users** (stored in PostgreSQL)
- **Backend JWT tokens** (issued by FastAPI)

These won't appear in Firebase Emulator.

## 🧪 Testing Token Verification

1. **Login with email/password**
   - Enter credentials in the app
   - Watch console logs for token confirmation

2. **Check if token is stored**
   ```javascript
   await debugAuth.checkStoredToken();
   ```

3. **Verify token works with API**
   - After login, check if the app navigates to Main screen
   - This confirms the token is valid and being used

4. **Check backend logs**
   - Verify the login request reached the backend
   - Check if JWT token was generated

## 📝 Expected Behavior

When login is successful:
- ✅ Console shows token received and stored
- ✅ Token is decoded and shows user ID
- ✅ Auth store state shows `isAuthenticated: true`
- ✅ App navigates to Main screen automatically
- ✅ Token persists after app restart

## 🐛 Troubleshooting

### Token Not Appearing in Logs
- Check if backend API is running and accessible
- Verify API base URL is correct in `.env`
- Check network requests in React Native debugger

### Token Not Stored
- Check AsyncStorage permissions
- Verify auth store is updating correctly
- Check for errors in console

### Token Invalid
- Verify backend JWT secret key is set correctly
- Check token expiration time
- Ensure backend is using the same JWT algorithm (HS256)

## 🔐 Security Notes

- **Never log full tokens in production** - Only log first 20-30 characters
- **Tokens are stored securely** in AsyncStorage (encrypted on iOS, secure storage on Android)
- **Backend JWT tokens** expire after 7 days (configurable in backend)
- **Use HTTPS in production** to protect tokens in transit

