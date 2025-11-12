# Alembic Database Migrations

This project uses **Alembic** for automatic database migrations. When you add or modify fields in your SQLModel models, Alembic can automatically detect these changes and generate migration scripts.

## How It Works

1. **Define fields in models** - Add fields to your SQLModel classes (e.g., `app/models/user.py`)
2. **Generate migration** - Alembic detects changes and creates a migration script
3. **Apply migration** - Run the migration to update the database schema

## Setup

Alembic is already configured and ready to use. The configuration files are:
- `alembic.ini` - Alembic configuration
- `alembic/env.py` - Migration environment setup
- `alembic/versions/` - Directory containing migration scripts

## Quick Start

### 1. Generate a Migration (After Changing Models)

When you modify a model (add/remove fields), generate a migration:

```bash
# From project root
alembic revision --autogenerate -m "Add onboarding tracking fields"
```

Or from Docker container:
```bash
docker-compose exec api alembic revision --autogenerate -m "Description of changes"
```

### 2. Review the Generated Migration

Check the generated migration file in `alembic/versions/`:

```python
def upgrade() -> None:
    # Add column
    op.add_column('user_profiles', sa.Column('onboarding_screen', sa.String(50), nullable=True))
    op.add_column('user_profiles', sa.Column('onboarding_started_at', sa.DateTime(), nullable=True))

def downgrade() -> None:
    # Remove column
    op.drop_column('user_profiles', 'onboarding_started_at')
    op.drop_column('user_profiles', 'onboarding_screen')
```

### 3. Apply the Migration

```bash
# Apply all pending migrations
alembic upgrade head
```

Or from Docker:
```bash
docker-compose exec api alembic upgrade head
```

### 4. Run Migrations Automatically (Script)

Use the provided script:

```bash
# From project root
python scripts/run_migrations.py

# From Docker
docker-compose exec api python scripts/run_migrations.py
```

## Common Commands

### Check Migration Status

```bash
alembic current
```

Shows the current database revision.

### View Migration History

```bash
alembic history
```

Shows all migrations.

### Create Empty Migration (Manual)

If you need to write a migration manually:

```bash
alembic revision -m "Manual migration description"
```

### Rollback Migration

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>
```

### Upgrade to Specific Revision

```bash
alembic upgrade <revision_id>
```

## Workflow Example

### Adding a New Field

1. **Add field to model** (`app/models/user.py`):
```python
class UserProfile(SQLModel, table=True):
    # ... existing fields ...
    new_field: Optional[str] = Field(default=None)
```

2. **Generate migration**:
```bash
alembic revision --autogenerate -m "Add new_field to UserProfile"
```

3. **Review generated migration** (`alembic/versions/xxxx_add_new_field.py`)

4. **Apply migration**:
```bash
alembic upgrade head
```

That's it! The database is now updated.

## Automatic Migration on Startup (Optional)

You can configure the app to run migrations automatically on startup:

```python
# In app/main.py or app/db/database.py
def init_db():
    # Run migrations first
    import subprocess
    subprocess.run(["alembic", "upgrade", "head"], check=False)
    
    # Then create any missing tables (for development)
    SQLModel.metadata.create_all(engine)
```

**Note**: For production, run migrations separately before starting the app.

## Integration with Docker

### Run Migrations in Docker

```bash
# Run migrations
docker-compose exec api alembic upgrade head

# Generate new migration
docker-compose exec api alembic revision --autogenerate -m "Description"

# Check status
docker-compose exec api alembic current
```

### Add to Docker Compose (Optional)

You can add a migration service to `docker-compose.yml`:

```yaml
migrate:
  build:
    context: .
    dockerfile: Dockerfile
  command: alembic upgrade head
  environment:
    - DATABASE_URL=postgresql://veya_user:veya_password@db:5432/veya
  depends_on:
    db:
      condition: service_healthy
  networks:
    - veya-network
  profiles:
    - migrate
```

Then run:
```bash
docker-compose --profile migrate run --rm migrate
```

## Best Practices

1. **Always review generated migrations** - Autogenerate is smart but not perfect
2. **Test migrations** - Test on development database first
3. **Version control** - Commit migration files to git
4. **Backup before migration** - In production, backup database before running migrations
5. **One migration per change** - Don't mix unrelated changes in one migration

## Troubleshooting

### Migration Conflicts

If you have migration conflicts:

```bash
# Check current revision
alembic current

# See what revisions are pending
alembic heads

# Merge branches if needed
alembic merge -m "Merge branches" <rev1> <rev2>
```

### Reset Database (Development Only)

```bash
# ⚠️ WARNING: This will delete all data!
# Drop all tables
alembic downgrade base

# Recreate from scratch
alembic upgrade head
```

### Fix Stale Migration State

If the database state doesn't match migrations:

```bash
# Stamp the database to match current model state (development only)
alembic stamp head
```

## Migration Files

Migration files are stored in `alembic/versions/` and follow this naming:
```
<revision_id>_<description>.py
```

Example: `a1b2c3d4e5f6_add_onboarding_fields.py`

## Example: Adding Onboarding Fields

1. **Model** (`app/models/user.py`):
```python
class UserProfile(SQLModel, table=True):
    onboarding_screen: Optional[str] = Field(default=None)
    onboarding_started_at: Optional[datetime] = Field(default=None)
```

2. **Generate migration**:
```bash
alembic revision --autogenerate -m "Add onboarding tracking fields"
```

3. **Apply**:
```bash
alembic upgrade head
```

The database now has the new fields! No manual SQL needed.

## Comparison: Manual vs Alembic

### Manual Scripts (Old Way)
- ❌ Manual SQL writing
- ❌ No version tracking
- ❌ Hard to rollback
- ❌ Error-prone

### Alembic (New Way)
- ✅ Automatic detection
- ✅ Version tracking
- ✅ Easy rollback
- ✅ Tested and reliable
- ✅ Team collaboration

## Files

- `alembic.ini` - Configuration file
- `alembic/env.py` - Migration environment
- `alembic/script.py.mako` - Migration template
- `alembic/versions/` - Migration scripts directory
- `scripts/run_migrations.py` - Helper script to run migrations

## Related Documentation

- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [SQLAlchemy Migrations](https://docs.sqlalchemy.org/en/20/core/metadata.html)

