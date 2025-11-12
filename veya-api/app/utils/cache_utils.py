"""
Cache utility functions for invalidating cached data.
"""
from uuid import UUID
from app.db.redis_client import Cache

USER_INFO_CACHE_PREFIX = "user:info:"


def invalidate_user_info_cache(user_id: UUID):
    """Invalidate cached user info for a specific user."""
    cache_key = f"{USER_INFO_CACHE_PREFIX}{user_id}"
    Cache.delete(cache_key)

