# Redis Setup Guide

## Overview

Redis has been integrated into the Veya API for:
- **Caching** - Improve performance by caching frequently accessed data
- **Message Queue** - Background task processing (ready for future use)

## Configuration

### Environment Variables

- `REDIS_URL` - Redis connection string (default: `redis://localhost:6379/0`)
- `REDIS_ENABLED` - Enable/disable Redis (default: `true`)

### Docker Compose

Redis is automatically configured in `docker-compose.yml`:
- Container: `veya-redis`
- Port: `6379`
- Persistence: Enabled with AOF (Append Only File)
- Memory limit: 256MB with LRU eviction policy
- Health checks: Automatic

## Usage

### Basic Caching

```python
from app.db.redis_client import Cache

# Set cache with TTL (time to live in seconds)
Cache.set("user:123", "user_data_json", ttl=3600)  # Cache for 1 hour

# Get from cache
cached_data = Cache.get("user:123")

# Check if key exists
if Cache.exists("user:123"):
    # Key exists
    pass

# Delete key
Cache.delete("user:123")

# Clear all keys matching a pattern
Cache.clear_pattern("user:*")  # Clears all user keys
```

### Message Queue

```python
from app.db.redis_client import MessageQueue

# Push message to queue
MessageQueue.push("tasks", "task_data_json")

# Pop message from queue (non-blocking)
task = MessageQueue.pop("tasks")

# Pop message with timeout (blocking)
task = MessageQueue.pop("tasks", timeout=5)  # Wait up to 5 seconds

# Get queue length
length = MessageQueue.length("tasks")
```

### Example in API Route

```python
from fastapi import APIRouter
from app.db.redis_client import Cache
import json

router = APIRouter()

@router.get("/users/{user_id}")
def get_user(user_id: str):
    # Try cache first
    cache_key = f"user:{user_id}"
    cached_user = Cache.get(cache_key)
    
    if cached_user:
        return {"source": "cache", "data": json.loads(cached_user)}
    
    # Fetch from database
    user = fetch_user_from_db(user_id)
    
    # Cache for 30 minutes
    Cache.set(cache_key, json.dumps(user), ttl=1800)
    
    return {"source": "database", "data": user}
```

## Deployment

### Local Development

Redis is automatically started with Docker Compose:
```bash
docker-compose up -d
```

### Production

#### Option 1: Self-hosted (Docker)
Redis runs in the same Docker Compose setup - no additional configuration needed!

#### Option 2: Managed Redis

**AWS ElastiCache:**
- Create Redis cluster in ElastiCache Console
- Update `REDIS_URL` environment variable
- Example: `redis://your-cluster.xxxxx.cache.amazonaws.com:6379/0`

**DigitalOcean Managed Redis:**
- Create Redis database in DigitalOcean
- Get connection URL
- Update `REDIS_URL` environment variable

**Redis Cloud / Upstash:**
- Sign up and create database
- Get connection URL
- Update `REDIS_URL` environment variable
- Good for serverless deployments (Lambda)

### Disabling Redis

If you don't want to use Redis, set:
```bash
REDIS_ENABLED=false
```

The application will work normally without Redis (caching will be disabled).

## Health Check

The `/health` endpoint now includes Redis status:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"  // or "disabled" or "disconnected"
}
```

## Best Practices

1. **Cache Keys**: Use consistent naming patterns (e.g., `user:{id}`, `session:{id}`)
2. **TTL**: Set appropriate TTL based on data freshness requirements
3. **Error Handling**: The Cache utility handles errors gracefully and returns `None`/`False` if Redis is unavailable
4. **Memory Management**: Redis is configured with 256MB limit and LRU eviction
5. **Persistence**: AOF is enabled for data durability

## Monitoring

### Check Redis Status

```bash
# In Docker container
docker exec -it veya-redis redis-cli ping
# Should return: PONG

# Check memory usage
docker exec -it veya-redis redis-cli info memory

# List all keys (use with caution in production)
docker exec -it veya-redis redis-cli keys "*"
```

### Redis CLI

Access Redis CLI:
```bash
docker exec -it veya-redis redis-cli
```

## Troubleshooting

### Connection Issues

1. Check if Redis container is running:
   ```bash
   docker-compose ps redis
   ```

2. Check Redis logs:
   ```bash
   docker-compose logs redis
   ```

3. Verify connection string in environment variables

### Memory Issues

If Redis runs out of memory:
- Increase memory limit in docker-compose.yml
- Review cached data and adjust TTLs
- Check for memory leaks in your code

### Performance

- Use `hiredis` (included in requirements) for better performance
- Monitor Redis performance with `redis-cli --stat`
- Consider Redis Cluster for high-traffic scenarios

## Future Enhancements

- [ ] Session storage in Redis
- [ ] Rate limiting using Redis
- [ ] Real-time features with Redis Pub/Sub
- [ ] Background job processing with Celery + Redis
- [ ] Distributed locking for concurrent operations

