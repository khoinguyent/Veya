"""
Migration script to add fields column to personalization_templates table.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.db.database import engine


def add_fields_column():
    """Add fields JSONB column to personalization_templates table."""
    with Session(engine) as session:
        try:
            # Add fields column if it doesn't exist
            session.exec(text("""
                ALTER TABLE personalization_templates 
                ADD COLUMN IF NOT EXISTS fields JSONB DEFAULT '[]'::jsonb;
            """))
            
            session.commit()
            print("✅ Successfully added fields column")
            return True
            
        except Exception as e:
            session.rollback()
            print(f"❌ Error adding column: {e}")
            return False


if __name__ == "__main__":
    success = add_fields_column()
    sys.exit(0 if success else 1)

