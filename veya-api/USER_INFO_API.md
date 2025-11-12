# User Info API with Redis Caching

## Overview

The `/api/users/me/info` endpoint provides frontend-friendly user information optimized for display. The response is cached in Redis for 30 minutes to reduce database load and improve response times.

## Endpoint

### GET /api/users/me/info

**Description**: Get user information optimized for frontend display (cached).

**Authentication**: Required (Bearer token)

**Query Parameters**:
- `use_cache` (boolean, optional): Set to `false` to bypass cache. Default: `true`

**Response**: `UserDisplayInfoResponse`

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "display_name": "Display Name",
  "firstname": "First",
  "lastname": "Last",
  "nickname": "Nickname",
  "avatar_url": "https://...",
  "has_profile": true,
  "profile_name": "Profile Name",
  "onboarding_completed": false,
  "onboarding_completion_percentage": 90,
  "current_onboarding_screen": "personalize",
  "has_personalization": true,
  "has_consent": false,
  "stats": {
    "day_streak": 7,
    "longest_streak": 14,
    "total_checkins": 28,
    "badges_count": 3,
    "minutes_practiced": 245,
    "last_checkin_at": "2025-11-07T06:30:00"
  },
  "greeting": {
    "title": "Good evening",
    "subtitle": "Unwind and reflect gently",
    "icon": "moon",
    "theme": {
      "card": "#F4ECFF",
      "highlight": "#F8F2FF",
      "accent": "#7A5DA1",
      "text_primary": "#4A3E68",
      "text_secondary": "#7D6B97"
    }
  },
  "timezone": "America/Los_Angeles",
  "created_at": "2025-11-07T15:24:40.500877",
  "last_login_at": "2025-11-07T16:11:49.047477"
}
```

## Response Fields

### Basic User Info
- `id` (UUID): User ID
- `email` (string, optional): User email
- `username` (string, optional): Username
- `display_name` (string, optional): Display name
- `firstname` (string, optional): First name
- `lastname` (string, optional): Last name
- `nickname` (string, optional): Nickname
- `avatar_url` (string, optional): Avatar URL

### Profile Info
- `has_profile` (boolean): Whether user has a profile
- `profile_name` (string, optional): Profile name

### Onboarding Status
- `onboarding_completed` (boolean): Whether onboarding is completed
- `onboarding_completion_percentage` (int): Completion percentage (0-100)
- `current_onboarding_screen` (string, optional): Current onboarding screen

### Quick Stats
- `has_personalization` (boolean): Whether user has personalization data
- `has_consent` (boolean): Whether user has given data consent
- `stats` (object): Aggregated metrics for the profile overview
  - `day_streak` (int): Current daily streak
  - `longest_streak` (int): Longest streak reached
  - `total_checkins` (int): Number of completed check-ins
  - `badges_count` (int): Earned badges count
  - `minutes_practiced` (int): Total mindful minutes recorded
  - `last_checkin_at` (datetime, optional): Most recent check-in timestamp
- `greeting` (object): Dynamic greeting payload for the profile screen
  - `title` (string): Greeting title based on local time
  - `subtitle` (string): Supporting copy for the greeting
  - `icon` (string): Feather icon name to display
  - `theme` (object): Color palette used to render the greeting card
    - `card`, `highlight`, `accent`, `text_primary`, `text_secondary`
- `timezone` (string): IANA timezone identifier used to compute greetings (defaults to `UTC`)

### Timestamps
- `created_at` (datetime): Account creation date
- `last_login_at` (datetime, optional): Last login date

## Caching

### Cache Configuration
- **TTL**: 30 minutes (1800 seconds)
- **Cache Key**: `user:info:{user_id}`
- **Storage**: Redis

### Cache Invalidation

The cache is automatically invalidated when:
- User profile is updated (`PUT /api/users/me`)
- User profile is created/updated (`POST /api/users/me/profile`)
- User profile is updated (`PUT /api/users/me/profile`)
- Onboarding screen is updated (`POST /api/onboarding/screen`)

### Cache Behavior

1. **First Request**: Fetches from database, stores in cache, returns response
2. **Subsequent Requests**: Returns cached data (fast response)
3. **After Update**: Cache is invalidated, next request fetches fresh data
4. **Cache Miss**: If cache is unavailable or corrupted, falls back to database

## Usage Examples

### Get User Info (with cache)

```bash
curl -X GET "http://localhost:8000/api/users/me/info" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get User Info (bypass cache)

```bash
curl -X GET "http://localhost:8000/api/users/me/info?use_cache=false" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend Integration

```javascript
// React/TypeScript example
const getUserInfo = async (token: string) => {
  const response = await fetch('http://localhost:8000/api/users/me/info', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
};

// Usage
const userInfo = await getUserInfo(token);
console.log(userInfo.display_name); // Display in header
console.log(userInfo.onboarding_completed); // Check onboarding status
console.log(userInfo.avatar_url); // Display avatar
```

## Performance

### Cache Benefits
- **First Request**: ~50-100ms (database query)
- **Cached Requests**: ~5-10ms (Redis lookup)
- **Cache Hit Rate**: Expected 90%+ for frequently accessed endpoints

### Cache Statistics

Monitor cache performance:
```bash
# Check Redis keys
docker-compose exec redis redis-cli KEYS "user:info:*"

# Check cache TTL
docker-compose exec redis redis-cli TTL "user:info:{user_id}"
```

## Error Handling

The API gracefully handles cache failures:
- If Redis is unavailable, falls back to database
- If cache data is corrupted, falls back to database
- Errors are logged but don't affect the response

## Comparison with Other Endpoints

### GET /api/users/me
- **Purpose**: Full user profile with all details
- **Caching**: Not cached
- **Use Case**: Detailed profile view, settings page

### GET /api/users/me/info
- **Purpose**: Lightweight user info for display
- **Caching**: Cached (30 minutes)
- **Use Case**: Header, navigation, quick user display

### GET /api/users/me/profile
- **Purpose**: Personalization profile data
- **Caching**: Not cached
- **Use Case**: Onboarding, personalization screens

## Best Practices

1. **Use for Display**: Use this endpoint for displaying user info in headers, navigation, etc.
2. **Cache Awareness**: Remember that data is cached for 30 minutes
3. **Bypass When Needed**: Use `use_cache=false` when you need real-time data
4. **Error Handling**: Handle cases where cache might be unavailable

## Implementation Details

### Cache Key Format
```
user:info:{user_id}
```

### Cache Value Format
JSON string of `UserDisplayInfoResponse` serialized with Pydantic

### Cache Invalidation
```python
from app.utils.cache_utils import invalidate_user_info_cache

# Invalidate cache for a user
invalidate_user_info_cache(user_id)
```

## Monitoring

### Cache Metrics to Monitor
- Cache hit rate
- Cache miss rate
- Average response time
- Cache size
- TTL distribution

### Redis Commands

```bash
# Check all user info cache keys
docker-compose exec redis redis-cli KEYS "user:info:*"

# Check specific user cache
docker-compose exec redis redis-cli GET "user:info:{user_id}"

# Check cache TTL
docker-compose exec redis redis-cli TTL "user:info:{user_id}"

# Clear all user info cache
docker-compose exec redis redis-cli --scan --pattern "user:info:*" | xargs docker-compose exec -T redis redis-cli DEL
```

## Troubleshooting

### Cache Not Working
1. Check Redis connection: `curl http://localhost:8000/health`
2. Check Redis logs: `docker-compose logs redis`
3. Verify cache key format
4. Check TTL settings

### Stale Data
1. Verify cache invalidation is called on updates
2. Check cache TTL (should be 30 minutes)
3. Use `use_cache=false` to bypass cache if needed

### Performance Issues
1. Monitor cache hit rate
2. Check Redis memory usage
3. Verify Redis connection pool settings
4. Consider adjusting TTL based on usage patterns

