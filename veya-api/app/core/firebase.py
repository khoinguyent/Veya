"""
Firebase Authentication utilities for verifying Firebase ID tokens.
Supports both production Firebase and Firebase Emulator for development.
"""
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth
import logging
import os

logger = logging.getLogger(__name__)

_firebase_app: Optional[firebase_admin.App] = None
_use_emulator: bool = False


def initialize_firebase():
    """Initialize Firebase Admin SDK."""
    global _firebase_app, _use_emulator
    
    if _firebase_app is not None:
        return _firebase_app
    
    from app.core.config import settings
    
    # Check if using Firebase Emulator
    firebase_emulator_host = os.getenv("FIREBASE_AUTH_EMULATOR_HOST")
    _use_emulator = firebase_emulator_host is not None
    
    if _use_emulator:
        # Use emulator - Firebase Admin SDK will route to emulator when FIREBASE_AUTH_EMULATOR_HOST is set
        try:
            # For emulator, we can initialize with ApplicationDefaultCredentials
            # The FIREBASE_AUTH_EMULATOR_HOST env var will make SDK use emulator
            # Use a default project ID for emulator (can be any string)
            project_id = settings.firebase_project_id or "demo-veya"
            
            # Try to initialize with default app (if already exists, get it)
            try:
                _firebase_app = firebase_admin.get_app()
                logger.info(f"Firebase emulator already initialized at {firebase_emulator_host}")
            except ValueError:
                # Create a mock credential for emulator (won't be used, but required by SDK)
                # In emulator mode, actual credentials are not needed
                try:
                    _firebase_app = firebase_admin.initialize_app(
                        options={"projectId": project_id}
                    )
                    logger.info(f"Firebase initialized with emulator at {firebase_emulator_host}")
                except Exception as init_error:
                    # If that fails, try with ApplicationDefaultCredentials
                    _firebase_app = firebase_admin.initialize_app(
                        project_id=project_id
                    )
                    logger.info(f"Firebase initialized with emulator at {firebase_emulator_host} (using default credentials)")
        except Exception as e:
            logger.warning(f"Firebase emulator initialization failed: {e}")
            logger.info("Continuing without Firebase - emulator may not be available")
            _firebase_app = None
    else:
        # Production mode - use credentials
        try:
            # Try to initialize with credentials file if specified
            if settings.firebase_credentials_path and os.path.exists(settings.firebase_credentials_path):
                cred = credentials.Certificate(settings.firebase_credentials_path)
                _firebase_app = firebase_admin.initialize_app(cred)
                logger.info(f"Firebase initialized with credentials from {settings.firebase_credentials_path}")
            elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
                # Try to initialize with default credentials (for production)
                _firebase_app = firebase_admin.initialize_app()
                logger.info("Firebase initialized with GOOGLE_APPLICATION_CREDENTIALS")
            else:
                logger.warning("Firebase credentials not found. Firebase authentication will be disabled.")
                logger.info("Set FIREBASE_CREDENTIALS_PATH or GOOGLE_APPLICATION_CREDENTIALS to enable Firebase.")
                logger.info("Or set FIREBASE_AUTH_EMULATOR_HOST to use Firebase Emulator for development.")
                _firebase_app = None
        except Exception as e:
            logger.warning(f"Firebase initialization failed: {e}")
            logger.info("Firebase authentication will be disabled. Check your credentials.")
            # Don't raise - allow app to run without Firebase
            _firebase_app = None
    
    return _firebase_app


def verify_firebase_token(id_token: str) -> Optional[dict]:
    """
    Verify Firebase ID token and return decoded token.
    
    Args:
        id_token: Firebase ID token from client
        
    Returns:
        Decoded token dict with user info (uid, email, etc.) or None if invalid
    """
    if _firebase_app is None:
        logger.warning("Firebase not initialized. Cannot verify token.")
        return None
    
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except auth.InvalidIdTokenError:
        logger.warning("Invalid Firebase ID token")
        return None
    except auth.ExpiredIdTokenError:
        logger.warning("Expired Firebase ID token")
        return None
    except Exception as e:
        logger.error(f"Firebase token verification error: {e}")
        return None


def get_firebase_user(uid: str) -> Optional[dict]:
    """
    Get user info from Firebase by UID.
    
    Args:
        uid: Firebase user UID
        
    Returns:
        User record dict or None if not found
    """
    if _firebase_app is None:
        return None
    
    try:
        user_record = auth.get_user(uid)
        return {
            "uid": user_record.uid,
            "email": user_record.email,
            "email_verified": user_record.email_verified,
            "display_name": user_record.display_name,
            "photo_url": user_record.photo_url,
            "provider_id": user_record.provider_id,
        }
    except auth.UserNotFoundError:
        logger.warning(f"Firebase user not found: {uid}")
        return None
    except Exception as e:
        logger.error(f"Error getting Firebase user: {e}")
        return None

