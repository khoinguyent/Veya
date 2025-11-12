-- Update article blocks metadata for 'gentle-breathing-ladder' article
-- This script updates the presentation_style and block metadata directly in the database

-- First, update the article to use paged_blocks presentation style
UPDATE library_articles
SET 
  presentation_style = 'paged_blocks',
  presentation_config = '{
    "pageBackground": "#DDE8F8",
    "pagePadding": 20,
    "pageVerticalPadding": 40,
    "tapThreshold": 0.4,
    "defaultPadding": 32,
    "defaultAlign": "center",
    "defaultBlockBackground": "rgba(255,255,255,0.95)"
  }'::jsonb
WHERE slug = 'gentle-breathing-ladder';

-- Update block 1 (Hero block)
UPDATE library_article_blocks
SET metadata = '{
  "pageBackground": "#FFF5E6",
  "backgroundColor": "rgba(255,245,230,0.95)",
  "titleColor": "#2F3F4A",
  "subtitleColor": "rgba(47, 63, 74, 0.72)",
  "padding": 32,
  "align": "center",
  "justify": "flex-start",
  "textAlign": "center"
}'::jsonb
WHERE article_id = (SELECT id FROM library_articles WHERE slug = 'gentle-breathing-ladder')
  AND position = 1;

-- Update block 2 (Inhale & Rise)
UPDATE library_article_blocks
SET metadata = '{
  "pageBackground": "#E8F4F8",
  "backgroundColor": "rgba(255,255,255,0.95)",
  "textColor": "#2F3F4A",
  "headingColor": "#1A1A1A",
  "textAlign": "center",
  "padding": 32,
  "paddingVertical": 40,
  "paddingHorizontal": 28,
  "align": "center",
  "justify": "center",
  "fontSize": 18
}'::jsonb
WHERE article_id = (SELECT id FROM library_articles WHERE slug = 'gentle-breathing-ladder')
  AND position = 2;

-- Update block 3 (Pause & Notice)
UPDATE library_article_blocks
SET metadata = '{
  "pageBackground": "#F0F8F0",
  "backgroundColor": "rgba(255,255,255,0.95)",
  "textColor": "#2F3F4A",
  "headingColor": "#1A1A1A",
  "textAlign": "center",
  "padding": 32,
  "paddingVertical": 40,
  "paddingHorizontal": 28,
  "align": "center",
  "justify": "center",
  "fontSize": 18
}'::jsonb
WHERE article_id = (SELECT id FROM library_articles WHERE slug = 'gentle-breathing-ladder')
  AND position = 3;

-- Update block 4 (Illustration)
UPDATE library_article_blocks
SET metadata = '{
  "pageBackground": "#F8F0E8",
  "backgroundColor": "transparent",
  "padding": 24,
  "align": "center",
  "justify": "center",
  "borderRadius": 24,
  "resizeMode": "contain",
  "height": 400
}'::jsonb
WHERE article_id = (SELECT id FROM library_articles WHERE slug = 'gentle-breathing-ladder')
  AND position = 4;

-- Update block 5 (Exhale & Descend)
UPDATE library_article_blocks
SET metadata = '{
  "pageBackground": "#E8F4F8",
  "backgroundColor": "rgba(255,255,255,0.95)",
  "textColor": "#2F3F4A",
  "headingColor": "#1A1A1A",
  "textAlign": "center",
  "padding": 32,
  "paddingVertical": 40,
  "paddingHorizontal": 28,
  "align": "center",
  "justify": "center",
  "fontSize": 18
}'::jsonb
WHERE article_id = (SELECT id FROM library_articles WHERE slug = 'gentle-breathing-ladder')
  AND position = 5;

-- Update block 6 (Quote)
UPDATE library_article_blocks
SET metadata = '{
  "pageBackground": "#FFF0F5",
  "backgroundColor": "rgba(255,255,255,0.95)",
  "textColor": "#2F3F4A",
  "textAlign": "center",
  "padding": 32,
  "paddingVertical": 40,
  "paddingHorizontal": 28,
  "align": "center",
  "justify": "center",
  "fontSize": 20,
  "fontStyle": "italic"
}'::jsonb
WHERE article_id = (SELECT id FROM library_articles WHERE slug = 'gentle-breathing-ladder')
  AND position = 6;

-- Update block 7 (Integration)
UPDATE library_article_blocks
SET metadata = '{
  "pageBackground": "#DDE8F8",
  "backgroundColor": "rgba(255,255,255,0.95)",
  "textColor": "#2F3F4A",
  "headingColor": "#1A1A1A",
  "textAlign": "center",
  "padding": 32,
  "paddingVertical": 40,
  "paddingHorizontal": 28,
  "align": "center",
  "justify": "center",
  "fontSize": 18
}'::jsonb
WHERE article_id = (SELECT id FROM library_articles WHERE slug = 'gentle-breathing-ladder')
  AND position = 7;

-- Verify the updates
SELECT 
  a.slug,
  a.presentation_style,
  a.presentation_config,
  b.position,
  b.block_type,
  b.metadata
FROM library_articles a
JOIN library_article_blocks b ON b.article_id = a.id
WHERE a.slug = 'gentle-breathing-ladder'
ORDER BY b.position;

