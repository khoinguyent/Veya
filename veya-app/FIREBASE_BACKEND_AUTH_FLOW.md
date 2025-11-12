# Firebase + Backend Authentication Flow

## ✅ Implementation Complete

The app now uses **Firebase Authentication** for user authentication, then sends the Firebase ID token to the backend API for verification. The backend returns a JWT token that is used for all API calls.

## 🔄 Authentication Flow

### Registration Flow:
1. **Frontend**: User signs up with email/password using Firebase Auth
2. **Firebase**: Creates user and returns Firebase ID token
3. **Frontend**: Sends Firebase ID token to backend `/api/auth/firebase/register`
4. **Backend**: Verifies Firebase token, creates user in database, returns backend JWT
5. **Frontend**: Stores backend JWT token and user info in auth store
6. **Frontend**: User is authenticated and navigated to Main screen

### Login Flow:
1. **Frontend**: User signs in with email/password using Firebase Auth
2. **Firebase**: Returns Firebase ID token
3. **Frontend**: Sends Firebase ID token to backend `/api/auth/firebase/register`
4. **Backend**: Verifies Firebase token, finds/updates user, returns backend JWT
5. **Frontend**: Stores backend JWT token and user info in auth store
6. **Frontend**: User is authenticated and navigated to Main screen

### App Restart Flow:
1. **Frontend**: Firebase SDK checks if user is signed in (via AsyncStorage)
2. **Frontend**: If signed in, loads stored backend JWT token from AsyncStorage
3. **Frontend**: If backend token exists, user is authenticated
4. **Frontend**: If no backend token, gets Firebase ID token and authenticates with backend

## 📁 Files Modified

### 1. **Auth Service** (`src/services/authService.ts`)
   - ✅ `signup()` - Creates Firebase user, sends token to backend, returns backend JWT
   - ✅ `login()` - Signs in Firebase user, sends token to backend, returns backend JWT
   - ✅ `authenticateWithBackend()` - Sends Firebase ID token to backend API
   - ✅ Returns both Firebase user and backend auth response

### 2. **Auth Store** (`src/store/useAuthStore.ts`)
   - ✅ Stores backend JWT token (`backendToken`)
   - ✅ Stores backend user info (`backendUser`)
   - ✅ Uses backend user as primary user (not Firebase user)
   - ✅ Loads backend token from AsyncStorage on app restart
   - ✅ Automatically authenticates with backend if Firebase user exists but no backend token
   - ✅ `setBackendAuth()` - Stores backend JWT and user info
   - ✅ `refreshBackendToken()` - Refreshes backend JWT token

### 3. **Login Screen** (`src/screens/auth/Login.tsx`)
   - ✅ Uses `firebaseLogin()` from authService
   - ✅ Stores backend JWT token after successful login
   - ✅ Error handling for Firebase and backend errors

### 4. **Register Screen** (`src/screens/auth/Register.tsx`)
   - ✅ Uses `firebaseSignup()` from authService
   - ✅ Stores backend JWT token after successful signup
   - ✅ Error handling for Firebase and backend errors

## 🔑 Token Storage

### Firebase ID Token:
- **Storage**: Managed by Firebase SDK (AsyncStorage)
- **Usage**: Sent to backend for verification
- **Refresh**: Automatically refreshed by Firebase SDK

### Backend JWT Token:
- **Storage**: `AsyncStorage` key: `@veya:backend_token`
- **Usage**: Used for all backend API calls
- **Refresh**: Call `refreshBackendToken()` in auth store

### Backend User Info:
- **Storage**: `AsyncStorage` key: `@veya:backend_user`
- **Usage**: Primary user info displayed in app
- **Format**: JSON stringified user object

## 🌐 API Integration

### Backend Endpoint:
```
POST /api/auth/firebase/register
Content-Type: application/json

{
  "id_token": "firebase-id-token",
  "provider": "firebase"
}
```

### Response:
```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "display_name": "User Name",
    "avatar_url": "https://...",
    "is_guest": false,
    "auth_provider": "firebase",
    "is_active": true
  },
  "token": "backend-jwt-token",
  "is_new_user": true
}
```

## 🔧 Configuration

### Environment Variables:
```env
# Backend API URL
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api

# Firebase Emulator (for development)
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=localhost
EXPO_PUBLIC_FIREBASE_EMULATOR_PORT=9099
EXPO_PUBLIC_FIREBASE_PROJECT_ID=demo-veya
```

## 🚀 Usage

### Making Authenticated API Calls:
```typescript
import { useAuthStore } from './store/useAuthStore';
import { apiService } from './services/api';

const { backendToken } = useAuthStore();

// Use backend token for API calls
const response = await apiService.authenticatedRequest('/some-endpoint', {
  method: 'GET',
}, backendToken);
```

### Refreshing Backend Token:
```typescript
import { useAuthStore } from './store/useAuthStore';

const { refreshBackendToken } = useAuthStore();

// Refresh backend token (gets fresh Firebase token and exchanges it)
const newToken = await refreshBackendToken();
```

## ✅ Benefits

1. **Security**: Firebase handles authentication, backend handles authorization
2. **User Management**: Backend database stores user profiles and data
3. **Token Management**: Backend JWT tokens for API calls, Firebase tokens for auth
4. **Persistent Login**: Both Firebase and backend tokens persist across app restarts
5. **Automatic Sync**: Backend user info is kept in sync with Firebase auth state

## 🐛 Troubleshooting

### Backend Authentication Fails:
- ✅ Check if backend API is running
- ✅ Verify Firebase token is valid (check console logs)
- ✅ Check backend logs for token verification errors
- ✅ Verify `EXPO_PUBLIC_API_BASE_URL` is correct

### Token Not Stored:
- ✅ Check AsyncStorage permissions
- ✅ Check console logs for errors
- ✅ Verify backend response format matches expected structure

### User Not Authenticated on App Restart:
- ✅ Check if Firebase user is signed in
- ✅ Check if backend token exists in AsyncStorage
- ✅ Check console logs for authentication flow

## 📝 Next Steps

- [ ] Implement token refresh on 401 errors
- [ ] Add token expiration checking
- [ ] Implement social sign-in (Apple/Google) with backend integration
- [ ] Add email verification flow
- [ ] Add password reset functionality

