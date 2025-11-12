"""Add timezone column to user_profiles.

Revision ID: 20251108_add_profile_tz
Revises: 20251108_add_user_metrics
Create Date: 2025-11-08 18:50:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20251108_add_profile_tz"
down_revision = "20251108_add_user_metrics"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_profiles",
        sa.Column("timezone", sa.String(length=64), nullable=False, server_default="UTC"),
    )
    op.alter_column("user_profiles", "timezone", server_default=None)


def downgrade() -> None:
    op.drop_column("user_profiles", "timezone")
