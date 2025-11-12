"""Create user_metrics table for profile statistics."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20251108_add_user_metrics"
down_revision = "20251108_personalization_json"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("day_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("longest_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_checkins", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("badges_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("minutes_practiced", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_checkin_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", name="uq_user_metrics_user_id"),
    )
    op.create_index("ix_user_metrics_user_id", "user_metrics", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_user_metrics_user_id", table_name="user_metrics")
    op.drop_table("user_metrics")
