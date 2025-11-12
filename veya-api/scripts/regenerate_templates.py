"""
Script to delete all existing personalization templates and regenerate them.
This ensures we have exactly 11 records (basic, lifestyle, goals, challenges, practices, 
practice_preferences, experience_levels, mood_tendencies, practice_times, reminders, interests, consent).
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session
from app.db.database import engine
from app.utils.template_seeder import seed_templates


def regenerate_all_templates():
    """Delete all existing templates and regenerate them."""
    with Session(engine) as session:
        try:
            print("🔄 Regenerating all personalization templates...")
            result = seed_templates(session, overwrite=True, clear_existing=True)
            print(f"✅ {result.get('message', 'Templates regenerated successfully')}")
            
            # Verify count
            from sqlmodel import select
            from app.models.personalization_templates import PersonalizationTemplate
            count = len(session.exec(select(PersonalizationTemplate)).all())
            print(f"✅ Total records: {count}")
            
            # List all categories
            templates = session.exec(select(PersonalizationTemplate).order_by(PersonalizationTemplate.view_order)).all()
            print("\n📋 Template categories:")
            for t in templates:
                print(f"  {t.view_order}. {t.category} (view_order: {t.view_order}, screen_key: {t.screen_key}, type: {t.screen_type})")
            
            return True
            
        except Exception as e:
            print(f"❌ Error regenerating templates: {e}")
            import traceback
            traceback.print_exc()
            return False


if __name__ == "__main__":
    success = regenerate_all_templates()
    sys.exit(0 if success else 1)

