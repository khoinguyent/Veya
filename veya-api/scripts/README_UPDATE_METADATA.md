# Update Article Block Metadata

This script updates the article blocks metadata for the "Gentle Breathing Ladder" article to enable paged blocks presentation with proper styling.

## Option 1: Using SQL Script (Recommended)

If you have direct database access, run the SQL script:

```bash
# Connect to your database
psql -U your_username -d your_database_name -f scripts/update_article_metadata.sql
```

Or if using a connection string:
```bash
psql "postgresql://user:password@localhost:5432/dbname" -f scripts/update_article_metadata.sql
```

## Option 2: Using Python Script

If the database is running and accessible:

```bash
cd /Users/123khongbiet/Documents/Mindfulness/Veya/veya-api
source .venv/bin/activate
python scripts/update_article_metadata.py
```

## What This Script Does

1. **Updates the article** (`gentle-breathing-ladder`) to use `presentation_style: "paged_blocks"`
2. **Sets presentation_config** with default settings:
   - Page background: `#DDE8F8`
   - Padding and alignment defaults
3. **Updates each block's metadata** with:
   - Block-specific page backgrounds (different pastel colors)
   - Text alignment (centered)
   - Padding and spacing
   - Typography settings

## Block Metadata Summary

- **Block 1 (Hero)**: Cream background (`#FFF5E6`)
- **Block 2 (Inhale & Rise)**: Light blue background (`#E8F4F8`)
- **Block 3 (Pause & Notice)**: Light green background (`#F0F8F0`)
- **Block 4 (Illustration)**: Light beige background (`#F8F0E8`)
- **Block 5 (Exhale & Descend)**: Light blue background (`#E8F4F8`)
- **Block 6 (Quote)**: Light pink background (`#FFF0F5`)
- **Block 7 (Integration)**: Light blue background (`#DDE8F8`)

All blocks are centered with appropriate padding and typography settings.

## Verification

After running the script, verify the updates by checking the API:

```bash
curl http://localhost:8000/api/library/articles/gentle-breathing-ladder | jq '.presentation_style, .blocks[].metadata'
```

Or check directly in the database:
```sql
SELECT 
  a.slug,
  a.presentation_style,
  b.position,
  b.block_type,
  b.metadata
FROM library_articles a
JOIN library_article_blocks b ON b.article_id = a.id
WHERE a.slug = 'gentle-breathing-ladder'
ORDER BY b.position;
```

