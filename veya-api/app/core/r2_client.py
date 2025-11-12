"""
Cloudflare R2 client for storing and retrieving resources.
"""
import boto3
import logging
from typing import Optional, Dict, Any
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

_r2_client: Optional[boto3.client] = None


def get_r2_client():
    """
    Initialize and return R2 client.
    R2 is S3-compatible, so we use boto3.
    """
    global _r2_client
    
    if _r2_client is None:
        from app.core.config import settings
        
        if not all([
            settings.r2_account_id,
            settings.r2_access_key_id,
            settings.r2_secret_access_key,
            settings.r2_bucket_name
        ]):
            logger.warning("R2 credentials not configured. Resource uploads will be disabled.")
            return None
        
        try:
            _r2_client = boto3.client(
                's3',
                endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.r2_access_key_id,
                aws_secret_access_key=settings.r2_secret_access_key,
                region_name='auto',  # R2 uses 'auto' for region
            )
            logger.info("R2 client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize R2 client: {e}")
            return None
    
    return _r2_client


def upload_file_to_r2(
    file_content: bytes,
    r2_key: str,
    content_type: str,
    metadata: Optional[Dict[str, str]] = None
) -> bool:
    """
    Upload file to Cloudflare R2.
    
    Args:
        file_content: File content as bytes
        r2_key: R2 object key (path in bucket)
        content_type: MIME type
        metadata: Optional metadata dict
    
    Returns:
        True if successful, False otherwise
    """
    from app.core.config import settings
    
    client = get_r2_client()
    if not client:
        logger.error("R2 client not available")
        return False
    
    try:
        extra_args = {
            'ContentType': content_type,
        }
        
        if metadata:
            extra_args['Metadata'] = metadata
        
        client.put_object(
            Bucket=settings.r2_bucket_name,
            Key=r2_key,
            Body=file_content,
            **extra_args
        )
        
        logger.info(f"File uploaded to R2: {r2_key}")
        return True
    except ClientError as e:
        logger.error(f"Failed to upload file to R2: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error uploading to R2: {e}")
        return False


def delete_file_from_r2(r2_key: str) -> bool:
    """
    Delete file from Cloudflare R2.
    
    Args:
        r2_key: R2 object key
    
    Returns:
        True if successful, False otherwise
    """
    from app.core.config import settings
    
    client = get_r2_client()
    if not client:
        logger.error("R2 client not available")
        return False
    
    try:
        client.delete_object(
            Bucket=settings.r2_bucket_name,
            Key=r2_key
        )
        logger.info(f"File deleted from R2: {r2_key}")
        return True
    except ClientError as e:
        logger.error(f"Failed to delete file from R2: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error deleting from R2: {e}")
        return False


def get_r2_public_url(r2_key: str) -> str:
    """
    Generate public URL for R2 object.
    
    Args:
        r2_key: R2 object key
    
    Returns:
        Public URL (either custom domain or R2 public URL)
    """
    from app.core.config import settings
    
    # If custom domain is configured, use it
    if settings.r2_public_domain:
        return f"https://{settings.r2_public_domain}/{r2_key}"
    
    # Otherwise, use R2 public URL format
    # Note: R2 public URLs require public bucket or signed URLs
    # For public buckets: https://<account-id>.r2.cloudflarestorage.com/<bucket>/<key>
    if settings.r2_account_id:
        return f"https://pub-{settings.r2_account_id}.r2.dev/{settings.r2_bucket_name}/{r2_key}"
    
    # Fallback
    return f"https://r2.dev/{settings.r2_bucket_name}/{r2_key}"


def get_presigned_url(r2_key: str, expiration: int = 3600) -> Optional[str]:
    """
    Generate presigned URL for private R2 objects.
    
    Args:
        r2_key: R2 object key
        expiration: URL expiration time in seconds (default: 1 hour)
    
    Returns:
        Presigned URL or None if failed
    """
    from app.core.config import settings
    
    client = get_r2_client()
    if not client:
        return None
    
    try:
        url = client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.r2_bucket_name,
                'Key': r2_key
            },
            ExpiresIn=expiration
        )
        return url
    except ClientError as e:
        logger.error(f"Failed to generate presigned URL: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error generating presigned URL: {e}")
        return None


def check_file_exists(r2_key: str) -> bool:
    """
    Check if file exists in R2.
    
    Args:
        r2_key: R2 object key
    
    Returns:
        True if file exists, False otherwise
    """
    from app.core.config import settings
    
    client = get_r2_client()
    if not client:
        return False
    
    try:
        client.head_object(
            Bucket=settings.r2_bucket_name,
            Key=r2_key
        )
        return True
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            return False
        logger.error(f"Error checking file existence: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error checking file existence: {e}")
        return False

