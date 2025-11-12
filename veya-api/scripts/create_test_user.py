"""
Script to create a test user with specified details and generate a JWT token.
This user can be used to bypass login on the frontend for development.
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.db.database import engine
from app.models.user import User, UserProfile, AuthProvider
from app.core.security import create_access_token
from app.core.config import settings


def create_test_user():
    """Create a test user with the specified details."""
    print("=" * 60)
    print("Creating Test User")
    print("=" * 60)
    
    email = "khoinguyent@gmail.com"
    firstname = "To"
    lastname = "Nguyen"
    nickname = "Kyan"
    
    with Session(engine) as session:
        try:
            # Check if user already exists
            statement = select(User).where(User.email == email)
            existing_user = session.exec(statement).first()
            
            if existing_user:
                print(f"⚠️  User with email {email} already exists.")
                print(f"   User ID: {existing_user.id}")
                
                # Update user details
                existing_user.firstname = firstname
                existing_user.lastname = lastname
                existing_user.nickname = nickname
                existing_user.display_name = f"{firstname} {lastname}"
                existing_user.email_verified = True
                existing_user.is_guest = False
                existing_user.auth_provider = AuthProvider.EMAIL
                existing_user.is_active = True
                existing_user.updated_at = datetime.utcnow()
                existing_user.last_login_at = datetime.utcnow()
                
                session.add(existing_user)
                session.commit()
                session.refresh(existing_user)
                
                user = existing_user
                print("✅ Updated existing user with new details")
            else:
                # Create new user
                user = User(
                    email=email,
                    firstname=firstname,
                    lastname=lastname,
                    nickname=nickname,
                    display_name=f"{firstname} {lastname}",
                    email_verified=True,
                    is_guest=False,
                    auth_provider=AuthProvider.EMAIL,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    last_login_at=datetime.utcnow(),
                )
                
                session.add(user)
                session.commit()
                session.refresh(user)
                print("✅ Created new user")
            
            # Create or update user profile
            if not user.profile:
                profile = UserProfile(
                    user_id=user.id,
                    name=f"{firstname} {lastname}",
                    created_at=datetime.utcnow(),
                )
                session.add(profile)
                session.commit()
                print("✅ Created user profile")
            else:
                # Update profile name if needed
                if not user.profile.name:
                    user.profile.name = f"{firstname} {lastname}"
                    user.profile.updated_at = datetime.utcnow()
                    session.add(user.profile)
                    session.commit()
                    print("✅ Updated user profile")
            
            # Generate JWT token
            access_token_expires = timedelta(days=365)  # 1 year token for dev
            access_token = create_access_token(
                data={"sub": str(user.id)}, expires_delta=access_token_expires
            )
            
            print("\n" + "=" * 60)
            print("User Details")
            print("=" * 60)
            print(f"User ID:     {user.id}")
            print(f"Email:       {user.email}")
            print(f"Firstname:   {user.firstname}")
            print(f"Lastname:    {user.lastname}")
            print(f"Nickname:    {user.nickname}")
            print(f"Display Name: {user.display_name}")
            print(f"Auth Provider: {user.auth_provider.value}")
            print(f"Is Guest:    {user.is_guest}")
            print(f"Is Active:   {user.is_active}")
            
            print("\n" + "=" * 60)
            print("JWT Token (for frontend authentication)")
            print("=" * 60)
            print(access_token)
            print("\n" + "=" * 60)
            print("Usage in Frontend")
            print("=" * 60)
            print("Store this token and use it in the Authorization header:")
            print(f'Authorization: Bearer {access_token}')
            print("\nExample curl command:")
            print(f'curl -H "Authorization: Bearer {access_token}" http://localhost:8000/api/auth/me')
            print("=" * 60)
            
            # Save token to file for easy access
            token_file = Path(__file__).parent.parent / "test_user_token.txt"
            with open(token_file, "w") as f:
                f.write(access_token)
            print(f"\n✅ Token saved to: {token_file}")
            
            return user, access_token
            
        except Exception as e:
            print(f"❌ Error creating test user: {e}")
            session.rollback()
            raise


if __name__ == "__main__":
    create_test_user()

