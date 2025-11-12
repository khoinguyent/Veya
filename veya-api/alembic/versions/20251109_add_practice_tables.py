from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20251109_add_practice_tables"
down_revision = "20251109_add_journal_entries"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "practice_programs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("level", sa.String(length=64), nullable=True),
        sa.Column("category", sa.String(length=128), nullable=True),
        sa.Column("duration_days", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("cover_image_url", sa.String(length=512), nullable=True),
        sa.Column("hero_audio_url", sa.String(length=512), nullable=True),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=False), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=False), nullable=True),
        sa.UniqueConstraint("slug", name="uq_practice_program_slug"),
    )
    op.create_index("ix_practice_programs_slug", "practice_programs", ["slug"], unique=False)
    op.create_index("ix_practice_programs_is_featured", "practice_programs", ["is_featured"], unique=False)

    op.create_table(
        "practice_steps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("subtitle", sa.String(length=255), nullable=True),
        sa.Column("day_label", sa.String(length=64), nullable=True),
        sa.Column("est_duration_minutes", sa.Integer(), nullable=True),
        sa.Column("guide_type", sa.String(length=64), nullable=True),
        sa.Column("guide_reference", sa.String(length=255), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.ForeignKeyConstraint(["program_id"], ["practice_programs.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("program_id", "order_index", name="uq_practice_step_order"),
    )
    op.create_index("ix_practice_steps_program_id", "practice_steps", ["program_id"], unique=False)

    op.create_table(
        "practice_enrollments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=False), nullable=False, server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("last_practiced_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("current_step_index", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("streak_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("longest_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_completions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["program_id"], ["practice_programs.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "program_id", name="uq_practice_enrollment_user_program"),
    )
    op.create_index("ix_practice_enrollments_user_id", "practice_enrollments", ["user_id"], unique=False)
    op.create_index("ix_practice_enrollments_program_id", "practice_enrollments", ["program_id"], unique=False)

    op.create_table(
        "practice_session_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("enrollment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("step_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("practiced_on", sa.Date(), nullable=False, server_default=sa.text("CURRENT_DATE")),
        sa.Column("practiced_at", sa.DateTime(timezone=False), nullable=False, server_default=sa.text("now()")),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("minutes_practiced", sa.Integer(), nullable=True),
        sa.Column("streak_after", sa.Integer(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="{}"),
        sa.ForeignKeyConstraint(["enrollment_id"], ["practice_enrollments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["program_id"], ["practice_programs.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["step_id"], ["practice_steps.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_practice_session_logs_user_id", "practice_session_logs", ["user_id"], unique=False)
    op.create_index("ix_practice_session_logs_practiced_on", "practice_session_logs", ["practiced_on"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_practice_session_logs_practiced_on", table_name="practice_session_logs")
    op.drop_index("ix_practice_session_logs_user_id", table_name="practice_session_logs")
    op.drop_table("practice_session_logs")

    op.drop_index("ix_practice_enrollments_program_id", table_name="practice_enrollments")
    op.drop_index("ix_practice_enrollments_user_id", table_name="practice_enrollments")
    op.drop_table("practice_enrollments")

    op.drop_index("ix_practice_steps_program_id", table_name="practice_steps")
    op.drop_table("practice_steps")

    op.drop_index("ix_practice_programs_is_featured", table_name="practice_programs")
    op.drop_index("ix_practice_programs_slug", table_name="practice_programs")
    op.drop_table("practice_programs")
