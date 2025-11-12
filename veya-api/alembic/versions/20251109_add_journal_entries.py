from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20251109_add_journal_entries"
down_revision = "20251109_add_avatar_columns"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "journal_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=True),
        sa.Column("emoji", sa.String(length=8), nullable=True),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("tags", postgresql.JSONB(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("mood", sa.String(length=64), nullable=True),
        sa.Column("source", sa.String(length=64), nullable=True),
        sa.Column("is_favorite", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("local_date", sa.Date(), nullable=False),
        sa.Column("local_timezone", sa.String(length=64), server_default="UTC", nullable=False),
        sa.Column("created_local_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("updated_local_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("sequence_in_day", sa.Integer(), server_default="1", nullable=False),
        sa.Column("sentiment_score", sa.Float(), nullable=True),
        sa.Column("word_count", sa.Integer(), nullable=True),
        sa.Column("weather_snapshot", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("attachments", postgresql.JSONB(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("created_from_device", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_index("ix_journal_entries_user_id", "journal_entries", ["user_id"])
    op.create_index("ix_journal_entries_local_date", "journal_entries", ["local_date"])
    op.create_index("ix_journal_entries_created_at", "journal_entries", ["created_at"])
    op.create_index("ix_journal_entries_mood", "journal_entries", ["mood"])
    op.create_index("ix_journal_entries_is_favorite", "journal_entries", ["is_favorite"])
    op.create_index("ix_journal_entries_sequence", "journal_entries", ["sequence_in_day"])


def downgrade() -> None:
    op.drop_index("ix_journal_entries_sequence", table_name="journal_entries")
    op.drop_index("ix_journal_entries_is_favorite", table_name="journal_entries")
    op.drop_index("ix_journal_entries_mood", table_name="journal_entries")
    op.drop_index("ix_journal_entries_created_at", table_name="journal_entries")
    op.drop_index("ix_journal_entries_local_date", table_name="journal_entries")
    op.drop_index("ix_journal_entries_user_id", table_name="journal_entries")
    op.drop_table("journal_entries")
