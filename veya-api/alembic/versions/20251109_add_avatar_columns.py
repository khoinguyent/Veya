"""Add R2 avatar fields to users.

Revision ID: 20251109_add_avatar_columns
Revises: 20251109_update_library_fields
Create Date: 2025-11-09 11:05:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20251109_add_avatar_columns"
down_revision = "20251109_update_library_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("avatar_r2_key", sa.String(length=512), nullable=True))
        batch_op.add_column(sa.Column("avatar_uploaded_at", sa.DateTime(), nullable=True))
        batch_op.create_index("ix_users_avatar_r2_key", ["avatar_r2_key"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_index("ix_users_avatar_r2_key")
        batch_op.drop_column("avatar_uploaded_at")
        batch_op.drop_column("avatar_r2_key")
