"""Move user profile personalization fields into JSONB map.

Revision ID: 20251108_personalization_json
Revises: 705bce2a62ab
Create Date: 2025-11-07 19:05:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import json

# revision identifiers, used by Alembic.
revision = "20251108_personalization_json"
down_revision = "78dbae40ad41"
branch_labels = None
depends_on = None

PERSONALIZATION_STRING_FIELDS = [
    "name",
    "age_range",
    "gender",
    "occupation",
    "wake_time",
    "sleep_time",
    "work_hours",
    "screen_time",
    "experience_level",
    "mood_tendency",
    "preferred_practice_time",
]

PERSONALIZATION_LIST_FIELDS = [
    "goals",
    "challenges",
    "practice_preferences",
    "interests",
    "reminder_times",
]

PERSONALIZATION_BOOL_FIELDS = [
    "data_consent",
    "marketing_consent",
]


def upgrade() -> None:
    op.add_column(
        "user_profiles",
        sa.Column(
            "personalization_data",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb")
        ),
    )

    bind = op.get_bind()
    result = bind.execute(
        sa.text(
            "SELECT id, {fields} FROM user_profiles".format(
                fields=", ".join(PERSONALIZATION_STRING_FIELDS + PERSONALIZATION_LIST_FIELDS + PERSONALIZATION_BOOL_FIELDS)
            )
        )
    )

    rows = result.mappings().all()
    for row in rows:
        personalization = {}

        for field in PERSONALIZATION_STRING_FIELDS:
            value = row[field]
            if value is not None:
                personalization[field] = value

        for field in PERSONALIZATION_LIST_FIELDS:
            value = row[field]
            if value:
                personalization[field] = value

        for field in PERSONALIZATION_BOOL_FIELDS:
            value = row[field]
            if value is not None:
                personalization[field] = bool(value)

        bind.execute(
            sa.text(
                "UPDATE user_profiles SET personalization_data = :data WHERE id = :id"
            ),
            {"id": row["id"], "data": json.dumps(personalization)}
        )

    op.alter_column("user_profiles", "personalization_data", server_default=None)

    # Drop old columns
    for field in reversed(PERSONALIZATION_LIST_FIELDS):
        op.drop_column("user_profiles", field)
    for field in reversed(PERSONALIZATION_STRING_FIELDS):
        op.drop_column("user_profiles", field)
    for field in reversed(PERSONALIZATION_BOOL_FIELDS):
        op.drop_column("user_profiles", field)


def downgrade() -> None:
    # Recreate old columns
    for field in PERSONALIZATION_STRING_FIELDS:
        op.add_column("user_profiles", sa.Column(field, sa.String(), nullable=True))

    json_type = postgresql.JSONB(astext_type=sa.Text())
    for field in PERSONALIZATION_LIST_FIELDS:
        op.add_column(
            "user_profiles",
            sa.Column(field, json_type, nullable=False, server_default=sa.text("'[]'::jsonb"))
        )

    for field in PERSONALIZATION_BOOL_FIELDS:
        op.add_column(
            "user_profiles",
            sa.Column(field, sa.Boolean(), nullable=False, server_default=sa.text("false"))
        )

    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id, personalization_data FROM user_profiles")).mappings().all()

    for row in rows:
        data = row["personalization_data"] or {}

        update_values = {field: data.get(field) for field in PERSONALIZATION_STRING_FIELDS}
        for field in PERSONALIZATION_LIST_FIELDS:
            value = data.get(field)
            update_values[field] = value if value is not None else []
        for field in PERSONALIZATION_BOOL_FIELDS:
            value = data.get(field)
            update_values[field] = bool(value) if value is not None else False

        bind.execute(
            sa.text(
                "UPDATE user_profiles SET {assignments} WHERE id = :id".format(
                    assignments=", ".join(f"{field} = :{field}" for field in update_values.keys())
                )
            ),
            {"id": row["id"], **update_values}
        )

    # Remove JSON column
    op.drop_column("user_profiles", "personalization_data")
