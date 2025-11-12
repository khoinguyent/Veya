"""
Redis client for caching and message queue operations.
"""
from typing import Optional
import redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    """
    Get Redis client instance.
    Returns None if Redis is disabled or connection fails.
    """
    global _redis_client
    
    if not settings.redis_enabled:
        return None
    
    if _redis_client is None:
        try:
            # Parse Redis URL
            redis_url = settings.redis_url
            
            # Create Redis client
            _redis_client = redis.from_url(
                redis_url,
                decode_responses=True,  # Automatically decode responses to strings
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # Test connection
            _redis_client.ping()
            logger.info("Redis connection established")
            
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Continuing without Redis.")
            _redis_client = None
    
    return _redis_client


def close_redis_client():
    """Close Redis client connection."""
    global _redis_client
    if _redis_client:
        _redis_client.close()
        _redis_client = None
        logger.info("Redis connection closed")


# Cache utilities
class Cache:
    """Simple cache utility class for common caching operations."""
    
    @staticmethod
    def get(key: str) -> Optional[str]:
        """Get value from cache."""
        client = get_redis_client()
        if client is None:
            return None
        try:
            return client.get(key)
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    @staticmethod
    def set(key: str, value: str, ttl: int = 3600) -> bool:
        """
        Set value in cache with TTL (time to live in seconds).
        Default TTL is 1 hour.
        """
        client = get_redis_client()
        if client is None:
            return False
        try:
            return client.setex(key, ttl, value)
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    @staticmethod
    def delete(key: str) -> bool:
        """Delete key from cache."""
        client = get_redis_client()
        if client is None:
            return False
        try:
            return bool(client.delete(key))
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    @staticmethod
    def exists(key: str) -> bool:
        """Check if key exists in cache."""
        client = get_redis_client()
        if client is None:
            return False
        try:
            return bool(client.exists(key))
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False
    
    @staticmethod
    def clear_pattern(pattern: str) -> int:
        """Clear all keys matching pattern. Returns number of keys deleted."""
        client = get_redis_client()
        if client is None:
            return 0
        try:
            keys = client.keys(pattern)
            if keys:
                return client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache clear_pattern error: {e}")
            return 0


# Message queue utilities (for future use)
class MessageQueue:
    """Message queue utility for background tasks."""
    
    @staticmethod
    def push(queue_name: str, message: str) -> bool:
        """Push message to queue."""
        client = get_redis_client()
        if client is None:
            return False
        try:
            return bool(client.lpush(queue_name, message))
        except Exception as e:
            logger.error(f"Queue push error: {e}")
            return False
    
    @staticmethod
    def pop(queue_name: str, timeout: int = 0) -> Optional[str]:
        """
        Pop message from queue.
        If timeout > 0, blocks until message is available.
        """
        client = get_redis_client()
        if client is None:
            return None
        try:
            if timeout > 0:
                result = client.brpop(queue_name, timeout=timeout)
                return result[1] if result else None
            else:
                return client.rpop(queue_name)
        except Exception as e:
            logger.error(f"Queue pop error: {e}")
            return None
    
    @staticmethod
    def length(queue_name: str) -> int:
        """Get queue length."""
        client = get_redis_client()
        if client is None:
            return 0
        try:
            return client.llen(queue_name)
        except Exception as e:
            logger.error(f"Queue length error: {e}")
            return 0

