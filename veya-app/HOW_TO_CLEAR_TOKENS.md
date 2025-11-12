# How to Clear Tokens for Testing New User Flow

This guide explains how to clear authentication tokens to test the new user flow on the emulator.

## Quick Methods

### Method 1: Using Debug Console (Easiest) ⭐

1. **Open React Native Debugger** or use the in-app developer menu
2. **Open Console** (Chrome DevTools or React Native Debugger)
3. **Run this command**:
   ```javascript
   // Check current auth state
   debugAuth.checkStoredToken()
   
   // Clear all auth data (tokens + Firebase Auth)
   await debugAuth.clearAuth()
   
   // Or clear only backend tokens
   await debugAuth.clearBackendTokens()
   ```

4. **Reload the app** (shake device → "Reload" or `Cmd+R` / `Ctrl+R`)

### Method 2: Using React Native Debugger

1. **Open React Native Debugger** (if installed)
2. **Go to Console tab**
3. **Run**:
   ```javascript
   const AsyncStorage = require('@react-native-async-storage/async-storage').default;
   
   // Clear all auth keys
   await AsyncStorage.multiRemove([
     '@veya:backend_token',
     '@veya:backend_user',
     '@veya:token',
     '@veya:user'
   ]);
   
   console.log('✅ Tokens cleared');
   ```

4. **Reload the app**

### Method 3: Programmatically in App (For Testing)

Add a temporary button or use a gesture to clear tokens:

```typescript
import { debugAuth } from '../utils/debugAuth';

// In your component
const handleClearAuth = async () => {
  await debugAuth.clearAuth();
  Alert.alert('Success', 'Auth data cleared. Reload the app.');
};
```

### Method 4: Uninstall and Reinstall App

1. **Uninstall the app** from the emulator
2. **Reinstall** by running `npm start` and opening the app
3. ✅ All AsyncStorage data will be cleared

### Method 5: Clear App Data (Android Emulator)

1. **Go to Android Settings** → Apps → Your App
2. **Tap "Storage"**
3. **Tap "Clear Data"**
4. ✅ All app data including AsyncStorage will be cleared

### Method 6: Reset iOS Simulator

1. **iOS Simulator Menu** → Device → Erase All Content and Settings
2. ✅ Simulator will be reset to factory state
3. **Reinstall app** by running `npm start`

## Verify Tokens are Cleared

After clearing, verify using:

```javascript
// In React Native Debugger console
await debugAuth.checkStoredToken()
```

You should see:
```
🔍 === Auth Debug Info ===
📦 Legacy Token: NOT FOUND
👤 Legacy User: NOT FOUND
🔑 Backend Token: NOT FOUND
👤 Backend User: NOT FOUND
🏪 Auth Store State:
  - Backend Token: null
  - Is Authenticated: false
  - Firebase User: null
======================
```

## Testing New User Flow

After clearing tokens:

1. **Reload the app** (shake device → "Reload")
2. **You should see**: Welcome screen
3. **Click "Continue"**
4. **Expected flow**: Welcome → Breathe → (1-min session) → Login

## What Gets Cleared

### `clearAuth()` - Clears Everything
- ✅ Backend JWT token (`@veya:backend_token`)
- ✅ Backend user data (`@veya:backend_user`)
- ✅ Legacy token (`@veya:token`) - if exists
- ✅ Legacy user (`@veya:user`) - if exists
- ✅ Firebase Auth session (signs out)
- ✅ Auth store state (resets)

### `clearBackendTokens()` - Partial Clear
- ✅ Backend JWT token
- ✅ Backend user data
- ❌ Firebase Auth session (preserved)
- ❌ Legacy tokens (preserved)

## Firebase Emulator Users

**Note**: Clearing tokens in the app does NOT delete users from Firebase Emulator.

To also clear Firebase Emulator users:

1. **Open Firebase Emulator UI**: http://localhost:4000
2. **Go to "Authentication" tab**
3. **Delete users** manually or clear all data
4. **Or restart Firebase Emulator**:
   ```bash
   docker-compose --profile dev restart firebase-emulator
   ```

## Quick Test Script

Add this to your app temporarily for quick testing:

```typescript
// In Welcome.tsx or any screen
import { debugAuth } from '../utils/debugAuth';

// Add a long press handler on the Continue button
const handleLongPress = async () => {
  Alert.alert(
    'Clear Auth Data',
    'This will clear all authentication data. Continue?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await debugAuth.clearAuth();
          Alert.alert('Success', 'Auth data cleared. Reload the app.');
        },
      },
    ]
  );
};

// Add to TouchableOpacity
<TouchableOpacity
  onPress={handleContinue}
  onLongPress={handleLongPress} // Long press to clear
  ...
>
```

## Recommended Method for Development

**Use Method 1 (Debug Console)** - It's the fastest and doesn't require app changes:

```javascript
// Quick clear and reload
await debugAuth.clearAuth()
// Then reload app
```

## Troubleshooting

### Tokens Still Present After Clear
1. Make sure you **reloaded the app** after clearing
2. Check if Firebase Auth is still signed in:
   ```javascript
   const { auth } = require('./src/core/firebase').default;
   console.log('Firebase user:', auth.currentUser);
   ```
3. Clear Firebase Auth explicitly:
   ```javascript
   const { signOut } = require('firebase/auth');
   await signOut(auth);
   ```

### App Still Shows Dashboard
1. **Force close the app** completely
2. **Reload** the app
3. Check if `isAuthenticated` is false in auth store
4. Verify tokens are cleared using `debugAuth.checkStoredToken()`

