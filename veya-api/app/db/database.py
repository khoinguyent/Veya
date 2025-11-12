from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

# Import all models to ensure they're registered
from app.models.user import User, UserProfile, SocialAccount
from app.models.session import ProgressSession
from app.models.mood import MoodEntry
from app.models.user_metrics import UserMetrics
from app.models.library import LibraryNode, LibraryArticle, LibraryArticleBlock
from app.models.journal import JournalEntry
from app.models.practice import (
    PracticeProgram,
    PracticeStep,
    PracticeEnrollment,
    PracticeSessionLog,
)

# Import Resource model if it exists (optional)
try:
    from app.models.resource import Resource
except ImportError:
    pass  # Resource model may not exist in all deployments

engine = create_engine(settings.database_url, echo=True)


def init_db():
    """
    Initialize database tables.
    
    This function creates tables using SQLModel.metadata.create_all().
    For production, use Alembic migrations instead:
    
    ```bash
    alembic upgrade head
    ```
    """
    # Use SQLModel to create tables (for development)
    # In production, use Alembic migrations
    SQLModel.metadata.create_all(engine)
    
    # Seed default templates if they don't exist
    try:
        from app.utils.template_seeder import seed_templates
        with Session(engine) as session:
            seed_templates(session, overwrite=False)
    except Exception as e:
        # Log error but don't fail initialization
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to seed default templates: {e}")
    # Library content no longer has automatic seed data.
    # Populate `library_nodes` manually through SQL or admin tooling.
    # Practice program seeding is temporarily disabled until the models
    # are migrated to SQLAlchemy 2.0-style annotations.


def get_session():
    """Dependency to get database session."""
    with Session(engine) as session:
        yield session
