# Firebase Auth Setup Guide

This guide will help you set up Firebase Authentication for the Veya app.

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## 2. Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click the **Web** icon (`</>`) to add a web app
4. Register your app and copy the configuration object

## 3. Configure Environment Variables

Create a `.env` file in the root of `veya-app` directory:

### For Development (with Firebase Emulator):

```env
# Firebase Emulator Configuration (required for development)
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=localhost
EXPO_PUBLIC_FIREBASE_EMULATOR_PORT=9099
EXPO_PUBLIC_FIREBASE_PROJECT_ID=demo-veya
```

**Note:** When using the emulator, minimal config is used. The app will connect to the Firebase Auth Emulator automatically.

### For Production:

```env
# Firebase Configuration (required for production)
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=false
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key-here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Note:** 
- The `EXPO_PUBLIC_` prefix is required for Expo to expose these variables to your app.
- For Android emulator, the host is automatically converted to `10.0.2.2` when set to `localhost`.
- For physical Android devices, use your machine's IP address instead of `localhost`.

## 4. Enable Authentication Methods

In Firebase Console:

1. Go to **Authentication** > **Sign-in method**
2. Enable the providers you want to use:
   - **Email/Password**: Enable this for email/password authentication
   - **Google**: Enable and configure OAuth consent screen
   - **Apple**: Enable and configure (requires Apple Developer account)

## 5. Using Firebase Auth Emulator (for Development)

The app is configured to work with the Firebase Auth Emulator running in Docker Compose.

### Option A: Using Docker Compose (Recommended)

1. Start the Firebase emulator with Docker Compose:
   ```bash
   cd veya-api
   docker-compose --profile dev up -d firebase-emulator
   ```

2. Add emulator configuration to your `.env` file in `veya-app`:
   ```env
   # Enable Firebase Emulator
   EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
   EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=localhost
   EXPO_PUBLIC_FIREBASE_EMULATOR_PORT=9099
   ```

3. For **Android Emulator**: The app automatically uses `10.0.2.2` instead of `localhost`
4. For **Physical Android Device**: Set `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` to your machine's IP address (e.g., `192.168.1.100`)
5. For **iOS Simulator**: `localhost` works directly

### Option B: Standalone Firebase Emulator

If you prefer to run the emulator standalone:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase: `firebase init`
3. Start the emulator: `firebase emulators:start --only auth`
4. Configure your `.env` file as shown in Option A

### Emulator Configuration

The emulator connection is automatically handled in `src/core/firebase.ts` based on:
- `EXPO_PUBLIC_USE_FIREBASE_EMULATOR`: Set to `'true'` to enable emulator
- `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST`: Emulator host (default: `localhost`)
- `EXPO_PUBLIC_FIREBASE_EMULATOR_PORT`: Emulator port (default: `9099`)

**Note:** The emulator only connects in development mode (`__DEV__ === true`).

## 6. How It Works

The app uses Firebase Authentication with the following flow:

- **On App Start**: Firebase Auth SDK checks if a user is signed in (via AsyncStorage persistence)
- **If Authenticated**: User is automatically routed to the Main dashboard
- **If Not Authenticated**: User sees the Welcome/Onboarding screen
- **Login/Signup**: Uses Firebase Auth SDK (`signInWithEmailAndPassword` / `createUserWithEmailAndPassword`)
- **Token Management**: Firebase SDK automatically handles token refresh and persistence
- **Persistent Login**: Login state persists across app restarts (handled by Firebase SDK)
- **Emulator Integration**: In development, all auth operations go through Firebase Auth Emulator
- **User Visibility**: New users appear immediately in Firebase Emulator UI at `http://localhost:4000`

## 7. Testing

1. Start your app: `npm start`
2. Navigate to Login screen
3. Sign in with email/password or social providers
4. You should be automatically redirected to the Main dashboard
5. Close and reopen the app - you should remain logged in

## Troubleshooting

- **"Firebase: Error (auth/invalid-api-key)"**: Check your `.env` file and ensure variables are prefixed with `EXPO_PUBLIC_`
- **"Firebase: Error (auth/network-request-failed)"**: Check your internet connection and Firebase project settings
- **Token not refreshing**: Ensure `onIdTokenChanged` listener is properly set up (already done in `useAuthStore`)

