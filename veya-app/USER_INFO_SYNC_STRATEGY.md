# User Info Sync Strategy

## Overview

This document explains how user information is fetched, cached, and synchronized between the backend database and local storage in the app.

## Architecture

### Components

1. **Backend API** (`/users/me/info`)
   - Returns lightweight user info optimized for frontend display
   - Cached in Redis for 30 minutes
   - Includes: basic info, profile status, onboarding status

2. **User Info Store** (`useUserInfoStore`)
   - Zustand store managing user info state
   - Handles local caching in AsyncStorage
   - Provides methods for fetching, updating, and clearing user info

3. **Auth Store** (`useAuthStore`)
   - Automatically triggers user info fetch after login/signup
   - Clears user info on logout

## Data Flow

### 1. Login/Signup Flow

```
User logs in/signs up
  ↓
Backend auth response received
  ↓
Auth store stores backend token
  ↓
Auth store automatically triggers user info fetch (async)
  ↓
User info fetched from API
  ↓
User info stored in Zustand store + AsyncStorage
  ↓
UI updates with user info
```

### 2. App Startup Flow

```
App starts
  ↓
Auth store initializes (checks for existing token)
  ↓
If authenticated:
  - Load cached user info from AsyncStorage (instant)
  - Fetch fresh user info from API (async, non-blocking)
  ↓
UI shows cached info immediately
  ↓
Fresh info updates UI when available
```

### 3. User Info Update Flow

```
User updates profile in app
  ↓
Update API called (PUT /users/me)
  ↓
Backend updates database
  ↓
Backend invalidates cache
  ↓
Frontend updates local cache optimistically
  ↓
Fetch fresh user info to confirm (optional)
  ↓
UI updates
```

## Caching Strategy

### Cache Duration
- **Backend cache**: 30 minutes (Redis)
- **Local cache**: 30 minutes (AsyncStorage)
- Cache key: `@veya:user_info`
- Timestamp key: `@veya:user_info_timestamp`

### Cache Validation

1. **On App Start**:
   - Load cached user info immediately (for instant display)
   - Check cache age
   - If cache < 30 minutes old: Use cached data
   - If cache > 30 minutes old: Keep as fallback, fetch fresh data

2. **On User Info Fetch**:
   - Check if cached data exists and is fresh
   - If fresh (< 30 minutes): Return cached data, skip API call
   - If stale (> 30 minutes): Fetch from API, update cache

3. **Force Refresh**:
   - Use `fetchUserInfo(token, true)` to bypass cache
   - Useful after profile updates or when user explicitly refreshes

## Sync Strategies

### 1. Automatic Sync

**When**:
- After login/signup
- On app startup (if authenticated)
- Periodically (optional, can be added)

**How**:
- Fetch user info from API
- Update Zustand store
- Update AsyncStorage cache
- Update UI

### 2. Optimistic Updates

**When**:
- User updates profile in app
- User changes display name/avatar

**How**:
1. Update local cache immediately (optimistic)
2. Call API to update backend
3. On success: Keep optimistic update
4. On failure: Revert to previous state, show error

### 3. Cache Invalidation

**When**:
- User updates profile
- User completes onboarding
- Backend data changes (handled by backend cache)

**How**:
- Backend invalidates Redis cache on update
- Frontend can optionally invalidate local cache
- Next fetch will get fresh data

## Implementation Details

### User Info Store Methods

```typescript
// Fetch user info (with caching)
fetchUserInfo(token: string, forceRefresh?: boolean): Promise<UserDisplayInfo | null>

// Update user info locally (optimistic update)
updateUserInfo(updates: Partial<UserDisplayInfo>): Promise<void>

// Clear user info (on logout)
clearUserInfo(): Promise<void>

// Load cached user info
loadCachedUserInfo(): Promise<void>
```

### API Methods

```typescript
// Get lightweight user info (cached)
getUserInfo(token: string, useCache?: boolean): Promise<UserDisplayInfo>

// Get full user profile (including personalization)
getUserProfile(token: string): Promise<UserWithProfile>

// Update user basic info
updateUserInfo(token: string, updates: UserUpdate): Promise<UserResponse>
```

## Best Practices

### 1. Always Show Cached Data First

- Load cached data on app start for instant UI
- Fetch fresh data in background
- Update UI when fresh data arrives

### 2. Handle Offline Scenarios

- Use cached data when offline
- Show offline indicator if needed
- Sync when connection is restored

### 3. Optimistic Updates

- Update UI immediately on user actions
- Revert if API call fails
- Show loading states appropriately

### 4. Cache Management

- Clear cache on logout
- Invalidate cache on profile updates
- Respect cache expiration times

## Example Usage

### Fetch User Info After Login

```typescript
// Automatically handled by auth store
// After setBackendAuth(), user info is fetched automatically
```

### Update User Info

```typescript
import { useUserInfoStore } from '../store/useUserInfoStore';
import { apiService } from '../services/api';

// Update on backend
const updatedUser = await apiService.updateUserInfo(token, {
  display_name: 'New Name',
  avatar_url: 'https://...',
});

// Update local cache optimistically
useUserInfoStore.getState().updateUserInfo({
  display_name: 'New Name',
  avatar_url: 'https://...',
});

// Optional: Fetch fresh data to confirm
await useUserInfoStore.getState().fetchUserInfo(token, true);
```

### Display User Info in UI

```typescript
import { useUserInfoStore } from '../store/useUserInfoStore';

function ProfileScreen() {
  const { userInfo, isLoading } = useUserInfoStore();
  
  if (isLoading && !userInfo) {
    return <LoadingScreen />;
  }
  
  if (!userInfo) {
    return <EmptyState />;
  }
  
  return (
    <View>
      <Text>{userInfo.display_name || userInfo.email}</Text>
      {userInfo.avatar_url && <Image source={{ uri: userInfo.avatar_url }} />}
    </View>
  );
}
```

## Future Enhancements

1. **Periodic Sync**: Refresh user info every X minutes when app is active
2. **Push Notifications**: Update cache when backend sends push notification
3. **Background Sync**: Sync user info in background service
4. **Conflict Resolution**: Handle conflicts when local and remote data differ
5. **Incremental Updates**: Only fetch changed fields instead of full user info

## Troubleshooting

### User Info Not Updating

1. Check if token is valid
2. Check network connection
3. Check cache expiration
4. Force refresh: `fetchUserInfo(token, true)`

### Stale Data Showing

1. Clear cache: `clearUserInfo()`
2. Force refresh: `fetchUserInfo(token, true)`
3. Check backend cache invalidation

### Performance Issues

1. Reduce cache duration if needed
2. Implement pagination for large data
3. Use incremental updates instead of full refresh

