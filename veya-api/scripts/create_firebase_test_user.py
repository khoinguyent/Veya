"""
Script to create a test user in Firebase Auth and register them in the backend.
This creates the user in Firebase (emulator or production) and then registers
them via the backend API, storing the Firebase UID in the database.
"""
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import requests
import os
from app.core.config import settings

# Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import auth, credentials
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("⚠️  Firebase Admin SDK not available. Install with: pip install firebase-admin")


def create_user_via_emulator_api(emulator_host: str, email: str, password: str, display_name: str):
    """Create user via Firebase Emulator REST API."""
    import requests
    
    # Determine the base URL
    if "localhost" in emulator_host or "127.0.0.1" in emulator_host:
        base_url = f"http://{emulator_host}"
    else:
        # If running in Docker, use the service name
        base_url = f"http://firebase-emulator:9099"
    
    project_id = "demo-veya"
    identity_toolkit_url = f"{base_url}/identitytoolkit.googleapis.com/v1/accounts:signUp"
    
    print(f"\n📝 Creating user in Firebase Emulator...")
    print(f"   Email: {email}")
    print(f"   Display Name: {display_name}")
    
    try:
        # Create user via REST API
        response = requests.post(
            identity_toolkit_url,
            json={
                "email": email,
                "password": password,
                "displayName": display_name,
                "returnSecureToken": True
            },
            params={"key": "fake-api-key"},  # Emulator doesn't need real key
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            firebase_uid = data.get("localId")
            id_token = data.get("idToken")
            
            print(f"✅ Created Firebase user with UID: {firebase_uid}")
            print(f"✅ Got ID token from emulator")
            
            # Register in backend
            return register_in_backend(id_token, firebase_uid, email)
        else:
            # User might already exist, try to sign in
            print(f"⚠️  Sign up returned {response.status_code}, trying sign in...")
            sign_in_url = f"{base_url}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
            
            response = requests.post(
                sign_in_url,
                json={
                    "email": email,
                    "password": password,
                    "returnSecureToken": True
                },
                params={"key": "fake-api-key"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                firebase_uid = data.get("localId")
                id_token = data.get("idToken")
                
                print(f"✅ User already exists in Firebase with UID: {firebase_uid}")
                print(f"✅ Got ID token from emulator")
                
                # Register in backend
                return register_in_backend(id_token, firebase_uid, email)
            else:
                print(f"❌ Failed to create/sign in user: {response.status_code}")
                print(f"   Response: {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ Error using Firebase Emulator API: {e}")
        import traceback
        traceback.print_exc()
        return None


def register_in_backend(id_token: str, firebase_uid: str, email: str):
    """Register user in backend using Firebase ID token."""
    print(f"\n📤 Registering user in backend...")
    try:
        import requests
        # Use localhost when running inside Docker container
        # The API is on the same container or accessible via localhost
        api_url = "http://localhost:8000"
        
        register_url = f"{api_url}/api/auth/firebase/register"
        
        response = requests.post(
            register_url,
            json={
                "id_token": id_token,
                "provider": "firebase"
            },
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code in [200, 201]:
            data = response.json()
            print(f"✅ User registered in backend")
            print(f"   User ID: {data['user']['id']}")
            print(f"   Firebase UID: {data['user'].get('firebase_uid', 'N/A')}")
            print(f"   Email: {data['user'].get('email', 'N/A')}")
            print(f"   Is New User: {data['is_new_user']}")
            print(f"\n🔑 JWT Token: {data['token']}")
            
            # Save token to file
            token_file = Path(__file__).parent.parent / "firebase_test_user_token.txt"
            with open(token_file, "w") as f:
                f.write(data['token'])
            print(f"✅ Token saved to: {token_file}")
            
            return {
                "firebase_uid": firebase_uid,
                "email": email,
                "jwt_token": data['token'],
                "user_id": data['user']['id']
            }
        else:
            print(f"❌ Backend registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error registering in backend: {e}")
        import traceback
        traceback.print_exc()
        return None


def create_firebase_user():
    """Create test user in Firebase Auth and register in backend."""
    print("=" * 60)
    print("Creating Firebase Test User")
    print("=" * 60)
    
    email = "khoinguyent@gmail.com"
    password = "test123456"
    display_name = "To Nguyen"
    
    # Check if using emulator
    firebase_emulator_host = os.getenv("FIREBASE_AUTH_EMULATOR_HOST")
    # Also check if emulator is likely running (common default)
    if not firebase_emulator_host:
        # Try to detect if emulator is available
        try:
            import requests
            response = requests.get("http://localhost:9099", timeout=2)
            if response.status_code < 500:  # Any response means emulator is there
                firebase_emulator_host = "localhost:9099"
                os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = firebase_emulator_host
        except:
            pass
    
    use_emulator = firebase_emulator_host is not None
    
    if not FIREBASE_AVAILABLE:
        print("❌ Firebase Admin SDK not available")
        print("   Please install: pip install firebase-admin")
        return None
    
    # For emulator, use REST API directly (simpler than Admin SDK)
    if use_emulator:
        print(f"🔧 Using Firebase Emulator at {firebase_emulator_host}")
        return create_user_via_emulator_api(firebase_emulator_host, email, password, display_name)
    
    # Initialize Firebase Admin SDK for production
    try:
        # Production Firebase
        if settings.firebase_credentials_path and os.path.exists(settings.firebase_credentials_path):
            cred = credentials.Certificate(settings.firebase_credentials_path)
            try:
                firebase_admin.get_app()
            except ValueError:
                firebase_admin.initialize_app(cred)
            print(f"✅ Firebase initialized with credentials from {settings.firebase_credentials_path}")
        elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            try:
                firebase_admin.get_app()
            except ValueError:
                firebase_admin.initialize_app()
            print("✅ Firebase initialized with GOOGLE_APPLICATION_CREDENTIALS")
        else:
            print("❌ Firebase credentials not found")
            print("   Set FIREBASE_CREDENTIALS_PATH or GOOGLE_APPLICATION_CREDENTIALS")
            return None
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        return None
    
    # Create user in Firebase Auth
    try:
        print(f"\n📝 Creating user in Firebase Auth...")
        print(f"   Email: {email}")
        print(f"   Display Name: {display_name}")
        
        # Check if user already exists
        try:
            existing_user = auth.get_user_by_email(email)
            print(f"⚠️  User already exists in Firebase with UID: {existing_user.uid}")
            firebase_uid = existing_user.uid
            
            # Update user if needed
            auth.update_user(firebase_uid, display_name=display_name)
            print("✅ Updated existing Firebase user")
        except auth.UserNotFoundError:
            # Create new user
            user_record = auth.create_user(
                email=email,
                password=password,
                display_name=display_name,
                email_verified=True,
            )
            firebase_uid = user_record.uid
            print(f"✅ Created new Firebase user with UID: {firebase_uid}")
        
    except Exception as e:
        print(f"❌ Error creating Firebase user: {e}")
        return None
    
    # Generate a custom token (for testing, can be exchanged for ID token)
    try:
        print(f"\n🔑 Generating Firebase custom token...")
        custom_token = auth.create_custom_token(firebase_uid)
        print(f"✅ Generated custom token")
        print(f"   Custom Token: {custom_token.decode('utf-8')[:50]}...")
    except Exception as e:
        print(f"⚠️  Could not generate custom token: {e}")
        custom_token = None
    
    # For emulator, we can use the REST API to get an ID token
    # For production, the frontend would exchange the custom token for an ID token
    id_token = None
    
    if use_emulator:
        print(f"\n🌐 Getting ID token from Firebase Emulator...")
        try:
            # Use Firebase Emulator REST API to sign in and get ID token
            emulator_url = f"http://{firebase_emulator_host.replace('localhost', '127.0.0.1')}"
            sign_in_url = f"{emulator_url}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
            
            response = requests.post(
                sign_in_url,
                json={
                    "email": email,
                    "password": password,
                    "returnSecureToken": True
                },
                params={"key": "fake-api-key"}  # Emulator doesn't need real key
            )
            
            if response.status_code == 200:
                data = response.json()
                id_token = data.get("idToken")
                print(f"✅ Got ID token from emulator")
            else:
                print(f"⚠️  Could not get ID token from emulator: {response.status_code}")
                print(f"   Response: {response.text}")
        except Exception as e:
            print(f"⚠️  Error getting ID token from emulator: {e}")
    
    # Register user in backend using Firebase ID token
    if id_token:
        print(f"\n📤 Registering user in backend...")
        try:
            api_url = os.getenv("API_URL", "http://localhost:8000")
            register_url = f"{api_url}/api/auth/firebase/register"
            
            response = requests.post(
                register_url,
                json={
                    "id_token": id_token,
                    "provider": "firebase"
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                print(f"✅ User registered in backend")
                print(f"   User ID: {data['user']['id']}")
                print(f"   Firebase UID: {data['user'].get('firebase_uid', 'N/A')}")
                print(f"   Is New User: {data['is_new_user']}")
                print(f"\n🔑 JWT Token: {data['token']}")
                
                # Save token to file
                token_file = Path(__file__).parent.parent / "firebase_test_user_token.txt"
                with open(token_file, "w") as f:
                    f.write(data['token'])
                print(f"✅ Token saved to: {token_file}")
                
                return {
                    "firebase_uid": firebase_uid,
                    "email": email,
                    "password": password,
                    "jwt_token": data['token'],
                    "user_id": data['user']['id']
                }
            else:
                print(f"❌ Backend registration failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return None
        except Exception as e:
            print(f"❌ Error registering in backend: {e}")
            return None
    else:
        print(f"\n⚠️  No ID token available. Manual steps:")
        print(f"   1. Use the custom token in your frontend app")
        print(f"   2. Exchange it for an ID token using Firebase SDK")
        print(f"   3. Call /api/auth/firebase/register with the ID token")
        print(f"\n   Firebase UID: {firebase_uid}")
        print(f"   Email: {email}")
        print(f"   Password: {password}")
        if custom_token:
            print(f"   Custom Token: {custom_token.decode('utf-8')}")
        
        return {
            "firebase_uid": firebase_uid,
            "email": email,
            "password": password,
            "custom_token": custom_token.decode('utf-8') if custom_token else None
        }


if __name__ == "__main__":
    result = create_firebase_user()
    
    if result:
        print("\n" + "=" * 60)
        print("Test User Created Successfully")
        print("=" * 60)
        print(f"Email:       {result.get('email')}")
        print(f"Password:    {result.get('password')}")
        print(f"Firebase UID: {result.get('firebase_uid')}")
        if result.get('jwt_token'):
            print(f"JWT Token:   {result['jwt_token'][:50]}...")
        print("=" * 60)
    else:
        print("\n❌ Failed to create test user")
        sys.exit(1)

