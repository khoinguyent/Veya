"""
Example usage of Redis caching in your API routes.

This file demonstrates how to use the Cache utility in your routes.
You can delete this file once you understand the usage patterns.
"""

from fastapi import APIRouter, Depends
from app.db.redis_client import Cache, MessageQueue
from app.db.database import get_session
from sqlmodel import Session

router = APIRouter(prefix="/cache-examples", tags=["cache-examples"])


@router.get("/cached-data")
def get_cached_data(key: str):
    """
    Example: Get data from cache or compute and cache it.
    
    Usage:
    1. Try to get from cache
    2. If not in cache, compute/fetch data
    3. Store in cache for future requests
    """
    # Try to get from cache
    cached_value = Cache.get(f"data:{key}")
    
    if cached_value:
        return {"source": "cache", "data": cached_value}
    
    # If not in cache, compute/fetch data (example)
    computed_data = f"Computed data for {key}"
    
    # Store in cache for 1 hour (3600 seconds)
    Cache.set(f"data:{key}", computed_data, ttl=3600)
    
    return {"source": "computed", "data": computed_data}


@router.post("/invalidate-cache")
def invalidate_cache(pattern: str):
    """
    Example: Invalidate cache by pattern.
    
    Usage: Clear all cache keys matching a pattern.
    For example: "data:*" will clear all keys starting with "data:"
    """
    deleted_count = Cache.clear_pattern(pattern)
    return {"message": f"Deleted {deleted_count} cache keys matching pattern: {pattern}"}


@router.post("/queue-task")
def queue_task(task_data: str):
    """
    Example: Add a task to the message queue.
    
    Usage: Push tasks to a queue for background processing.
    """
    success = MessageQueue.push("tasks", task_data)
    if success:
        return {"message": "Task queued successfully", "task": task_data}
    return {"message": "Failed to queue task"}, 500


@router.get("/queue-status")
def queue_status():
    """
    Example: Check queue status.
    
    Usage: Monitor queue length and health.
    """
    queue_length = MessageQueue.length("tasks")
    return {
        "queue": "tasks",
        "length": queue_length,
        "status": "healthy" if queue_length >= 0 else "error"
    }


# Example: Using cache in a dependency for route-level caching
def get_cached_user(user_id: str):
    """
    Example dependency that uses caching.
    
    Usage in routes:
    @router.get("/users/{user_id}")
    def get_user(user_id: str, user_data = Depends(lambda uid=user_id: get_cached_user(uid))):
        return user_data
    """
    cache_key = f"user:{user_id}"
    
    # Try cache first
    cached_user = Cache.get(cache_key)
    if cached_user:
        # In real app, deserialize JSON here
        return {"source": "cache", "user_id": user_id, "data": cached_user}
    
    # If not cached, fetch from database (example)
    # In real app, fetch from database here
    user_data = f"User data for {user_id}"
    
    # Cache for 30 minutes
    Cache.set(cache_key, user_data, ttl=1800)
    
    return {"source": "database", "user_id": user_id, "data": user_data}

