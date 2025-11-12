"""Update library tables with ordering, tags, icons, and active flags.

Revision ID: 20251109_update_library_fields
Revises: 20251108_create_library
Create Date: 2025-11-09 08:10:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20251109_update_library_fields"
down_revision = "20251108_create_library"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename display_order to order_index on categories/topics
    with op.batch_alter_table("library_categories") as batch_op:
        batch_op.alter_column("display_order", new_column_name="order_index")
        batch_op.add_column(sa.Column("icon", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("tags", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")))
        batch_op.add_column(sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    with op.batch_alter_table("library_topics") as batch_op:
        batch_op.alter_column("display_order", new_column_name="order_index")
        batch_op.add_column(sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.execute("ALTER INDEX ix_library_categories_display_order RENAME TO ix_library_categories_order_index")
    op.execute("ALTER INDEX ix_library_topics_display_order RENAME TO ix_library_topics_order_index")

    with op.batch_alter_table("library_articles") as batch_op:
        batch_op.add_column(sa.Column("tags", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")))

    # Drop server defaults now that columns exist
    op.execute("ALTER TABLE library_categories ALTER COLUMN tags DROP DEFAULT")
    op.execute("ALTER TABLE library_categories ALTER COLUMN is_active DROP DEFAULT")
    op.execute("ALTER TABLE library_topics ALTER COLUMN is_active DROP DEFAULT")
    op.execute("ALTER TABLE library_articles ALTER COLUMN tags DROP DEFAULT")


def downgrade() -> None:
    # Recreate defaults for downgrade safety
    op.execute("ALTER TABLE library_articles ALTER COLUMN tags SET DEFAULT '[]'::json")
    op.execute("ALTER TABLE library_topics ALTER COLUMN is_active SET DEFAULT true")
    op.execute("ALTER TABLE library_categories ALTER COLUMN is_active SET DEFAULT true")
    op.execute("ALTER TABLE library_categories ALTER COLUMN tags SET DEFAULT '[]'::json")

    with op.batch_alter_table("library_articles") as batch_op:
        batch_op.drop_column("tags")

    op.execute("ALTER INDEX ix_library_topics_order_index RENAME TO ix_library_topics_display_order")
    op.execute("ALTER INDEX ix_library_categories_order_index RENAME TO ix_library_categories_display_order")

    with op.batch_alter_table("library_topics") as batch_op:
        batch_op.drop_column("is_active")
        batch_op.alter_column("order_index", new_column_name="display_order")

    with op.batch_alter_table("library_categories") as batch_op:
        batch_op.drop_column("is_active")
        batch_op.drop_column("tags")
        batch_op.drop_column("icon")
        batch_op.alter_column("order_index", new_column_name="display_order")
