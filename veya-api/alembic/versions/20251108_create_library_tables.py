"""Create library tables for categories, topics, articles, and blocks.

Revision ID: 20251108_create_library
Revises: 20251108_add_profile_tz
Create Date: 2025-11-08 20:30:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20251108_create_library"
down_revision = "20251108_add_profile_tz"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "library_categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("slug", sa.String(length=255), nullable=False, unique=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("accent_color", sa.String(length=16), nullable=True),
        sa.Column("cover_image_url", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["parent_id"], ["library_categories.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_library_categories_parent", "library_categories", ["parent_id"])
    op.create_index("ix_library_categories_display_order", "library_categories", ["display_order"])

    op.create_table(
        "library_topics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False, unique=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("cover_image_url", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tags", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["category_id"], ["library_categories.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_library_topics_category_id", "library_topics", ["category_id"])
    op.create_index("ix_library_topics_display_order", "library_topics", ["display_order"])

    op.create_table(
        "library_articles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("topic_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False, unique=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("subtitle", sa.Text(), nullable=True),
        sa.Column("hero_image_url", sa.Text(), nullable=True),
        sa.Column("hero_video_url", sa.Text(), nullable=True),
        sa.Column("audio_url", sa.Text(), nullable=True),
        sa.Column("transcript_url", sa.Text(), nullable=True),
        sa.Column("content_locale", sa.String(length=32), nullable=False, server_default="en-US"),
        sa.Column("content_type", sa.String(length=64), nullable=False, server_default="article"),
        sa.Column("layout_variant", sa.String(length=64), nullable=True),
        sa.Column("reading_time_minutes", sa.Integer(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["topic_id"], ["library_topics.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_library_articles_topic_id", "library_articles", ["topic_id"])
    op.create_index("ix_library_articles_published_at", "library_articles", ["published_at"])

    op.create_table(
        "library_article_blocks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("article_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("block_type", sa.String(length=64), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["article_id"], ["library_articles.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_library_article_blocks_article_id", "library_article_blocks", ["article_id"])
    op.create_index("ix_library_article_blocks_position", "library_article_blocks", ["article_id", "position"], unique=True)

    # Remove server defaults now that tables exist
    op.execute("ALTER TABLE library_categories ALTER COLUMN display_order DROP DEFAULT")
    op.execute("ALTER TABLE library_categories ALTER COLUMN metadata DROP DEFAULT")
    op.execute("ALTER TABLE library_topics ALTER COLUMN display_order DROP DEFAULT")
    op.execute("ALTER TABLE library_topics ALTER COLUMN tags DROP DEFAULT")
    op.execute("ALTER TABLE library_topics ALTER COLUMN metadata DROP DEFAULT")
    op.execute("ALTER TABLE library_articles ALTER COLUMN content_locale DROP DEFAULT")
    op.execute("ALTER TABLE library_articles ALTER COLUMN content_type DROP DEFAULT")
    op.execute("ALTER TABLE library_articles ALTER COLUMN is_published DROP DEFAULT")
    op.execute("ALTER TABLE library_articles ALTER COLUMN metadata DROP DEFAULT")
    op.execute("ALTER TABLE library_article_blocks ALTER COLUMN position DROP DEFAULT")
    op.execute("ALTER TABLE library_article_blocks ALTER COLUMN payload DROP DEFAULT")


def downgrade() -> None:
    op.drop_index("ix_library_article_blocks_position", table_name="library_article_blocks")
    op.drop_index("ix_library_article_blocks_article_id", table_name="library_article_blocks")
    op.drop_table("library_article_blocks")

    op.drop_index("ix_library_articles_published_at", table_name="library_articles")
    op.drop_index("ix_library_articles_topic_id", table_name="library_articles")
    op.drop_table("library_articles")

    op.drop_index("ix_library_topics_display_order", table_name="library_topics")
    op.drop_index("ix_library_topics_category_id", table_name="library_topics")
    op.drop_table("library_topics")

    op.drop_index("ix_library_categories_display_order", table_name="library_categories")
    op.drop_index("ix_library_categories_parent", table_name="library_categories")
    op.drop_table("library_categories")
