"""
Script to set a password for a user.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.db.database import engine
from app.models.user import User
import bcrypt


def set_user_password(email: str, password: str):
    """Set password for a user by email."""
    print("=" * 60)
    print("Setting User Password")
    print("=" * 60)
    
    with Session(engine) as session:
        try:
            # Find user by email
            statement = select(User).where(User.email == email)
            user = session.exec(statement).first()
            
            if not user:
                print(f"❌ User with email {email} not found")
                return False
            
            # Hash and set password using bcrypt directly
            # Ensure password is not too long for bcrypt (72 bytes max)
            password_bytes = password.encode('utf-8')
            if len(password_bytes) > 72:
                print(f"❌ Password is too long (max 72 bytes)")
                return False
            
            # Generate salt and hash password
            salt = bcrypt.gensalt()
            password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
            user.password_hash = password_hash
            user.updated_at = None  # Will be set by the model
            
            session.add(user)
            session.commit()
            session.refresh(user)
            
            print(f"✅ Password set successfully for user: {email}")
            print(f"   User ID: {user.id}")
            print(f"   Email: {user.email}")
            print(f"   Display Name: {user.display_name}")
            return True
            
        except Exception as e:
            print(f"❌ Error setting password: {e}")
            session.rollback()
            return False


if __name__ == "__main__":
    # Default test user credentials
    email = "khoinguyent@gmail.com"
    password = "test123456"  # Default password - change if needed
    
    # Allow password to be passed as argument
    if len(sys.argv) > 1:
        password = sys.argv[1]
    
    print(f"Setting password for: {email}")
    print(f"Password: {'*' * len(password)}")
    print()
    
    set_user_password(email, password)
    print()
    print("=" * 60)
    print("Test User Credentials")
    print("=" * 60)
    print(f"Email:    {email}")
    print(f"Password: {password}")
    print("=" * 60)

