"""
Migration script to add firstname, lastname, and nickname fields to users table.
This script safely adds the columns if they don't exist.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.db.database import engine
from app.core.config import settings


def add_user_name_fields():
    """Add firstname, lastname, and nickname columns to users table if they don't exist."""
    print("Starting migration: Adding firstname, lastname, nickname fields to users table...")
    
    with Session(engine) as session:
        try:
            # Check if columns exist and add them if they don't
            # Using ALTER TABLE with IF NOT EXISTS equivalent logic
            
            # Check for firstname
            result = session.exec(
                text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'firstname'
                """)
            ).first()
            
            if not result:
                print("Adding 'firstname' column...")
                session.exec(text("ALTER TABLE users ADD COLUMN firstname VARCHAR(255)"))
                session.commit()
                print("✓ Added 'firstname' column")
            else:
                print("✓ 'firstname' column already exists")
            
            # Check for lastname
            result = session.exec(
                text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'lastname'
                """)
            ).first()
            
            if not result:
                print("Adding 'lastname' column...")
                session.exec(text("ALTER TABLE users ADD COLUMN lastname VARCHAR(255)"))
                session.commit()
                print("✓ Added 'lastname' column")
            else:
                print("✓ 'lastname' column already exists")
            
            # Check for nickname
            result = session.exec(
                text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'nickname'
                """)
            ).first()
            
            if not result:
                print("Adding 'nickname' column...")
                session.exec(text("ALTER TABLE users ADD COLUMN nickname VARCHAR(255)"))
                session.commit()
                print("✓ Added 'nickname' column")
            else:
                print("✓ 'nickname' column already exists")
            
            print("\n✅ Migration completed successfully!")
            
        except Exception as e:
            print(f"❌ Error during migration: {e}")
            session.rollback()
            raise


if __name__ == "__main__":
    add_user_name_fields()

