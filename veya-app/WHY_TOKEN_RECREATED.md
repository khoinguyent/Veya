# Why Token is Recreated After Clearing

## The Problem

After calling `clearAuth()` or `clearBackendTokens()`, you might see a new backend token being created automatically:

```
✅ Backend authentication successful
🔑 Backend JWT token received
👤 Backend user: ...
```

## Why This Happens

This is **automatic re-authentication**. Here's what's happening:

1. **You clear the backend token** from AsyncStorage
2. **Firebase Auth user is still signed in** (Firebase session wasn't cleared)
3. **App restarts or auth store initializes**
4. **Auth store detects**: Firebase user exists but no backend token
5. **Auth store automatically**: Gets Firebase ID token → Sends to backend → Gets new backend JWT
6. **Result**: New backend token is created automatically

## The Root Cause

The auth store's `initialize()` method has this logic:

```typescript
if (firebaseUser) {
  // Firebase user exists
  if (!backendToken) {
    // No backend token - automatically authenticate with backend
    const idToken = await getIdToken(firebaseUser, true);
    const backendAuth = await authenticateWithBackend(idToken, 'email');
    // New token is created!
  }
}
```

## Solutions

### Solution 1: Use `clearAuth()` (Recommended) ✅

`clearAuth()` now signs out from Firebase Auth FIRST, then clears tokens:

```javascript
await debugAuth.clearAuth()
```

This ensures:
1. ✅ Firebase Auth signs out
2. ✅ Backend tokens are cleared
3. ✅ Auth store is reset
4. ✅ **No automatic re-authentication** (because Firebase user is null)

### Solution 2: Clear Firebase Auth First

If you only cleared backend tokens, also sign out from Firebase:

```javascript
// In React Native Debugger console
const { signOut } = require('firebase/auth');
const { auth } = require('./src/core/firebase').default;
await signOut(auth);

// Then clear backend tokens
await debugAuth.clearBackendTokens();
```

### Solution 3: Clear Everything Manually

```javascript
// Sign out from Firebase
const { signOut } = require('firebase/auth');
const { auth } = require('./src/core/firebase').default;
await signOut(auth);

// Clear AsyncStorage
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
await AsyncStorage.multiRemove([
  '@veya:backend_token',
  '@veya:backend_user'
]);

// Reset auth store
const { useAuthStore } = require('./src/store/useAuthStore');
useAuthStore.setState({
  user: null,
  firebaseUser: null,
  backendToken: null,
  backendUser: null,
  isAuthenticated: false,
});

// Reload app
```

## Updated `clearAuth()` Function

The `clearAuth()` function has been updated to:

1. **Sign out from Firebase Auth FIRST** (prevents auto-re-auth)
2. **Wait 500ms** for signout to complete
3. **Clear tokens from AsyncStorage**
4. **Reset auth store state**
5. **Log detailed progress**

This ensures that after clearing, no new token will be created automatically.

## Testing New User Flow

### Step 1: Clear Auth (Signs out from Firebase + Clears tokens)
```javascript
await debugAuth.clearAuth()
```

### Step 2: Verify Everything is Cleared
```javascript
await debugAuth.checkStoredToken()
```

Should show:
- Backend Token: NOT FOUND
- Firebase User: null
- Is Authenticated: false

### Step 3: Reload App
- Shake device → "Reload"
- Or `Cmd+R` / `Ctrl+R`

### Step 4: Test Flow
- Welcome screen should appear
- Click Continue
- Should navigate to Breathe (no token)
- Complete session → Login

## Why This Design?

The automatic re-authentication is actually a **feature**, not a bug:

- ✅ **User Experience**: If Firebase session exists, automatically restore backend token
- ✅ **Seamless**: User doesn't need to login again if Firebase session is valid
- ✅ **Security**: Only works if Firebase user is authenticated

However, for **testing purposes**, you need to sign out from Firebase to prevent this.

## Summary

**Problem**: Token recreated after clearing  
**Cause**: Firebase user still signed in → Auto re-authentication  
**Solution**: Use `clearAuth()` which signs out from Firebase first  
**Result**: No automatic token creation ✅

