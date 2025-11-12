"""
Migration script to add view_order and screen metadata columns to personalization_templates table.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session, text
from app.db.database import engine


def add_view_order_columns():
    """Add view_order and screen metadata columns to personalization_templates table."""
    with Session(engine) as session:
        try:
            # Add view_order column if it doesn't exist
            session.exec(text("""
                ALTER TABLE personalization_templates 
                ADD COLUMN IF NOT EXISTS view_order INTEGER DEFAULT 0;
            """))
            
            # Add screen metadata columns
            session.exec(text("""
                ALTER TABLE personalization_templates 
                ADD COLUMN IF NOT EXISTS screen_key VARCHAR;
            """))
            
            session.exec(text("""
                ALTER TABLE personalization_templates 
                ADD COLUMN IF NOT EXISTS screen_title VARCHAR;
            """))
            
            session.exec(text("""
                ALTER TABLE personalization_templates 
                ADD COLUMN IF NOT EXISTS screen_subtitle VARCHAR;
            """))
            
            session.exec(text("""
                ALTER TABLE personalization_templates 
                ADD COLUMN IF NOT EXISTS screen_type VARCHAR;
            """))
            
            session.exec(text("""
                ALTER TABLE personalization_templates 
                ADD COLUMN IF NOT EXISTS screen_icon VARCHAR;
            """))
            
            # Create index on view_order for faster sorting
            session.exec(text("""
                CREATE INDEX IF NOT EXISTS idx_personalization_templates_view_order 
                ON personalization_templates(view_order);
            """))
            
            session.commit()
            print("✅ Successfully added view_order and screen metadata columns")
            return True
            
        except Exception as e:
            session.rollback()
            print(f"❌ Error adding columns: {e}")
            return False


if __name__ == "__main__":
    success = add_view_order_columns()
    sys.exit(0 if success else 1)

