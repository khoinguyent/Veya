# Template Files Explanation

## Quick Answer

### What is `template_seeder.py` used for?
**Purpose**: Utility script to **seed (populate) the database** with default template data.

**When it's used**:
- Initial database setup
- Running migrations
- Resetting templates to defaults
- Admin operations to update templates

**It does NOT**: Return data to API endpoints (that's the database's job)

### What is `personalization_defaults.py` used for?
**Purpose**: **Source file for default/seed data** (like a blueprint).

**When it's used**:
- By `template_seeder.py` to populate the database
- By `init.sql` as reference for SQL inserts
- As fallback documentation (what the defaults should be)

**It does NOT**: Serve data to API endpoints (that's the database's job)

### Should data return from the database?
**YES!** ✅ All API endpoints should return data from the `personalization_templates` table in the database.

The defaults file is only for **initial seeding**, not for runtime data.

## Data Flow

```
┌─────────────────────────────────┐
│ personalization_defaults.py     │  ← Source of default data (blueprint)
│ (Seed data, not runtime data)   │
└──────────────┬──────────────────┘
               │
               │ Used by
               ↓
┌─────────────────────────────────┐
│ template_seeder.py              │  ← Tool to populate database
│ (Seed utility, not API)         │
└──────────────┬──────────────────┘
               │
               │ Inserts/Updates
               ↓
┌─────────────────────────────────┐
│ personalization_templates table │  ← Single source of truth
│ (Database - production data)    │
└──────────────┬──────────────────┘
               │
               │ Queried by
               ↓
┌─────────────────────────────────┐
│ API Endpoints                   │  ← Returns data to frontend
│ /api/templates/onboarding       │
│ /api/templates/all              │
│ /api/templates/{category}       │
└─────────────────────────────────┘
```

## File Responsibilities

| File | Purpose | Used For | NOT Used For |
|------|---------|----------|--------------|
| `personalization_defaults.py` | Default seed data | Initial setup, migrations, resets | API responses |
| `template_seeder.py` | Database seeding utility | Populating database | API endpoints |
| `personalization_templates` (DB) | Production data | **ALL API responses** | Initial seeding (but seeded FROM defaults) |
| `init.sql` | SQL seed script | Database initialization | Runtime API |

## Current Implementation

### ✅ Correct Behavior
- API endpoints query the database first
- Data comes from `personalization_templates` table
- Database is the single source of truth

### ✅ What Changed
1. Removed fallback to defaults in API endpoints
2. Added logging warnings if database is empty
3. Clear documentation that defaults are only for seeding

## How to Use

### Initial Setup
```bash
# Option 1: Use init.sql (automatic on first DB creation)
docker-compose up -d db

# Option 2: Use template_seeder.py
docker-compose exec api python -c "
from app.utils.template_seeder import seed_templates
from app.db.database import engine, Session
session = Session(engine)
seed_templates(session, overwrite=True)
"
```

### Runtime (Normal Operation)
```bash
# API automatically queries database
curl http://localhost:8000/api/templates/onboarding
# Returns data from personalization_templates table
```

### Update Templates
```bash
# Use Admin API or update database directly
# Defaults file is NOT used for updates
```

## Summary

1. **`personalization_defaults.py`**: Seed data source (like a blueprint)
2. **`template_seeder.py`**: Tool to populate database (like a migration tool)
3. **Database**: Production data source (used by all APIs)
4. **Data should ALWAYS return from database** ✅

The defaults file is for **initial setup only**, not for runtime data!

