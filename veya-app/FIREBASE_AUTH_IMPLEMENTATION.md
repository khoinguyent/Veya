# Firebase Authentication Implementation

## ✅ Implementation Complete

The app now uses **Firebase Authentication** for all login/signup operations. Users will appear in the Firebase Emulator UI when using the emulator.

## 🔄 What Changed

### 1. **Firebase Configuration** (`src/core/firebase.ts`)
   - ✅ Uses minimal config for Firebase Emulator (when `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true`)
   - ✅ Automatically connects to Firebase Auth Emulator in development
   - ✅ Platform-specific emulator host handling (iOS/Android/Web)

### 2. **Auth Service** (`src/services/authService.ts`) - NEW
   - ✅ `signup()` - Create user with email/password
   - ✅ `login()` - Sign in with email/password
   - ✅ `logout()` - Sign out user
   - ✅ `listenToAuthChanges()` - Listen to auth state changes
   - ✅ `getCurrentUser()` - Get current authenticated user
   - ✅ `getIdToken()` - Get Firebase ID token

### 3. **Auth Store** (`src/store/useAuthStore.ts`)
   - ✅ Simplified to use only Firebase Auth
   - ✅ Removed manual token storage (Firebase SDK handles it)
   - ✅ Removed backend JWT token logic
   - ✅ Firebase SDK handles persistence automatically

### 4. **Login Screen** (`src/screens/auth/Login.tsx`)
   - ✅ Uses `firebaseLogin()` from authService
   - ✅ Removed backend API calls
   - ✅ Better error handling with Firebase error codes
   - ✅ Automatic navigation via Firebase auth state listener

### 5. **Register Screen** (`src/screens/auth/Register.tsx`)
   - ✅ Uses `firebaseSignup()` from authService
   - ✅ Removed backend API calls
   - ✅ Updates display name after signup
   - ✅ Better error handling with Firebase error codes

### 6. **App Navigator** (`src/navigation/AppNavigator.tsx`)
   - ✅ Already configured to use Firebase Auth state
   - ✅ Routes based on `isAuthenticated` from Firebase
   - ✅ Shows LoadingScreen while checking auth state

## 🚀 How to Test

### Step 1: Start Firebase Emulator

```bash
cd veya-api
docker-compose --profile dev up -d firebase-emulator
```

Or start standalone:
```bash
firebase emulators:start --only auth
```

### Step 2: Configure Environment

Create `.env` file in `veya-app`:
```env
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=localhost
EXPO_PUBLIC_FIREBASE_EMULATOR_PORT=9099
EXPO_PUBLIC_FIREBASE_PROJECT_ID=demo-veya
```

### Step 3: Start App

```bash
cd veya-app
npm start
```

### Step 4: Test Login/Signup

1. **Sign Up**:
   - Navigate to Register screen
   - Enter name, email, password
   - Click "Sign Up"
   - ✅ User should appear in Firebase Emulator UI (`http://localhost:4000`)
   - ✅ App should navigate to Main screen

2. **Login**:
   - Sign out if logged in
   - Navigate to Login screen
   - Enter email and password
   - Click "Sign In"
   - ✅ User should be authenticated
   - ✅ App should navigate to Main screen

3. **Verify in Emulator**:
   - Open `http://localhost:4000` in browser
   - Go to "Authentication" tab
   - ✅ Should see all users you created
   - ✅ Can verify user details (email, UID, etc.)

4. **Persistent Login**:
   - Close and reopen the app
   - ✅ User should remain logged in
   - ✅ App should navigate directly to Main screen

## ✅ Expected Behavior

### When Signing Up:
- Console shows: `✅ Firebase Auth: Signup successful!`
- Firebase Emulator UI shows new user in Authentication tab
- App navigates to Main screen automatically
- User stays logged in after app restart

### When Logging In:
- Console shows: `✅ Firebase Auth: Login successful!`
- Firebase ID token is logged (first 30 chars)
- App navigates to Main screen automatically
- User stays logged in after app restart

### In Firebase Emulator UI:
- All users appear in "Authentication" tab
- User details show: UID, Email, Creation Time, etc.
- Tokens are visible in Emulator logs

## 🔍 Debugging

### Check Console Logs:
```javascript
// In React Native debugger
console.log('Auth State:', useAuthStore.getState());
```

### Check Firebase Emulator:
- Open `http://localhost:4000`
- Go to "Authentication" tab
- See all registered users

### Get Firebase ID Token:
```javascript
import { getCurrentUser, getIdToken } from './services/authService';

const user = getCurrentUser();
if (user) {
  const token = await getIdToken();
  console.log('Firebase ID Token:', token);
}
```

## 🎯 Key Points

1. **No Backend API Calls**: All auth is handled by Firebase Auth SDK
2. **Automatic Persistence**: Firebase SDK handles token storage in AsyncStorage
3. **Emulator Integration**: All operations go through Firebase Auth Emulator in dev
4. **User Visibility**: Users appear immediately in Firebase Emulator UI
5. **Token Management**: Firebase SDK automatically refreshes tokens

## 📝 Next Steps

- [ ] Implement social sign-in (Apple/Google) using Firebase Auth
- [ ] Sync Firebase users with backend database (optional)
- [ ] Add email verification flow
- [ ] Add password reset functionality

## 🐛 Troubleshooting

### Users Not Appearing in Emulator UI
- ✅ Check if emulator is running: `docker-compose ps`
- ✅ Verify emulator connection in console logs
- ✅ Check if `EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true`
- ✅ Restart app after changing env variables

### Connection Errors
- ✅ For Android: Use `10.0.2.2` instead of `localhost`
- ✅ For iOS: `localhost` should work
- ✅ For physical devices: Use machine's IP address

### Auth State Not Updating
- ✅ Check console for Firebase Auth logs
- ✅ Verify `onAuthStateChanged` listener is set up
- ✅ Check if Firebase SDK initialized correctly

