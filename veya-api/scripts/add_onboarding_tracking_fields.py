"""
Migration script to add onboarding_screen and onboarding_started_at fields to user_profiles table.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.db.database import engine
from app.core.config import settings


def add_onboarding_tracking_fields():
    """Add onboarding_screen and onboarding_started_at columns to user_profiles table if they don't exist."""
    print("Starting migration: Adding onboarding tracking fields to user_profiles table...")
    
    with Session(engine) as session:
        try:
            # Check for onboarding_screen
            result = session.exec(
                text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_screen'
                """)
            ).first()
            
            if not result:
                print("Adding 'onboarding_screen' column...")
                session.exec(text("ALTER TABLE user_profiles ADD COLUMN onboarding_screen VARCHAR(50)"))
                session.commit()
                print("✓ Added 'onboarding_screen' column")
            else:
                print("✓ 'onboarding_screen' column already exists")
            
            # Check for onboarding_started_at
            result = session.exec(
                text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'user_profiles' AND column_name = 'onboarding_started_at'
                """)
            ).first()
            
            if not result:
                print("Adding 'onboarding_started_at' column...")
                session.exec(text("ALTER TABLE user_profiles ADD COLUMN onboarding_started_at TIMESTAMP"))
                session.commit()
                print("✓ Added 'onboarding_started_at' column")
            else:
                print("✓ 'onboarding_started_at' column already exists")
            
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            print(f"❌ Error during migration: {e}")
            session.rollback()
            raise


if __name__ == "__main__":
    add_onboarding_tracking_fields()

