# Gradient Background Guide

This guide explains how to add gradient backgrounds to article blocks using the `metadata` field.

## Frontend Implementation

The frontend now supports gradient backgrounds via two fields in block metadata:

1. **`backgroundGradient`**: Gradient for the individual block container
2. **`pageBackgroundGradient`**: Gradient for the full screen/page background (takes priority over `pageBackground`)

The implementation:
- **Checks for gradient**: If `metadata.pageBackgroundGradient` or `metadata.backgroundGradient` exists and is an array with at least 2 colors, it uses `LinearGradient`
- **Falls back to solid color**: If no gradient is provided, it uses the `pageBackground` or `backgroundColor` field
- **Gradient direction**: Defaults to diagonal (top-left to bottom-right: `start={{ x: 0, y: 0 }}`, `end={{ x: 1, y: 1 }}`)
- **Priority**: `pageBackgroundGradient` is checked first for full-screen background, then `backgroundGradient` for block-level background

## Database Metadata Structure

Add gradient fields to the `metadata` JSONB column in `library_article_blocks`:

### Example 1: Page Background Gradient (Full Screen)

```json
{
  "pageBackground": "#E8F4F8",
  "pageBackgroundGradient": ["#E8F4F8", "#DDE8F8"],
  "backgroundColor": "rgba(255,255,255,0.95)",
  "textColor": "#2F3F4A",
  "headingColor": "#1A1A1A",
  "padding": 32,
  "textAlign": "center"
}
```

**Note**: `pageBackgroundGradient` controls the full screen background. If present, it overrides `pageBackground`.

### Example 2: Block-Level Gradient Only

```json
{
  "pageBackground": "#E8F4F8",
  "backgroundColor": "rgba(255,255,255,0.95)",
  "backgroundGradient": ["#E8F4F8", "#DDE8F8"],
  "textColor": "#2F3F4A",
  "headingColor": "#1A1A1A",
  "padding": 32,
  "textAlign": "center"
}
```

**Note**: `backgroundGradient` only affects the block container, not the full screen.

### Example 3: Multi-Color Gradient

```json
{
  "pageBackground": "#FFF5E6",
  "backgroundGradient": ["#FFF5E6", "#FFEFD1", "#FFE4B5"],
  "textColor": "#2F3F4A",
  "padding": 32
}
```

### Example 3: Gradient with Transparency

```json
{
  "pageBackground": "#F0F8F0",
  "backgroundGradient": ["rgba(240,248,240,0.9)", "rgba(221,232,248,0.9)"],
  "textColor": "#2F3F4A",
  "padding": 32
}
```

## SQL Examples

### Update Existing Block with Page Background Gradient (Full Screen)

```sql
UPDATE library_article_blocks
SET metadata = jsonb_set(
  metadata,
  '{pageBackgroundGradient}',
  '["#E8F4F8", "#DDE8F8"]'::jsonb
)
WHERE id = 'your-block-id-here';
```

**Note**: This will make the entire screen background a gradient, not just the block.

### Update Existing Block with Block-Level Gradient

```sql
UPDATE library_article_blocks
SET metadata = jsonb_set(
  metadata,
  '{backgroundGradient}',
  '["#E8F4F8", "#DDE8F8"]'::jsonb
)
WHERE id = 'your-block-id-here';
```

**Note**: This only affects the block container, not the full screen.

### Insert New Block with Gradient

```sql
INSERT INTO library_article_blocks (
  article_id,
  position,
  block_type,
  payload,
  metadata
) VALUES (
  'article-uuid-here',
  2,
  'text',
  '{"heading": "Example", "body": "Content here"}'::jsonb,
  '{
    "pageBackground": "#E8F4F8",
    "backgroundGradient": ["#E8F4F8", "#DDE8F8"],
    "textColor": "#2F3F4A",
    "headingColor": "#1A1A1A",
    "padding": 32,
    "textAlign": "center"
  }'::jsonb
);
```

### Update Multiple Blocks with Gradients

```sql
-- Example: Add gradient to all text blocks in an article
UPDATE library_article_blocks
SET metadata = jsonb_set(
  metadata,
  '{backgroundGradient}',
  CASE 
    WHEN position = 1 THEN '["#FFF5E6", "#FFEFD1"]'::jsonb
    WHEN position = 2 THEN '["#E8F4F8", "#DDE8F8"]'::jsonb
    WHEN position = 3 THEN '["#F0F8F0", "#E8F4E8"]'::jsonb
    ELSE metadata->'backgroundGradient'
  END
)
WHERE article_id = 'your-article-uuid-here'
  AND block_type = 'text';
```

## Color Format Options

The `backgroundGradient` array accepts:
- **Hex colors**: `["#E8F4F8", "#DDE8F8"]`
- **RGB colors**: `["rgb(232,244,248)", "rgb(221,232,248)"]`
- **RGBA colors**: `["rgba(232,244,248,0.9)", "rgba(221,232,248,0.9)"]`
- **Named colors**: `["blue", "lightblue"]` (limited support)

**Note**: At least 2 colors are required. The first 2 colors will be used for the gradient.

## Gradient Direction

Currently, gradients use a diagonal direction (top-left to bottom-right). To customize:

1. **Horizontal** (left to right): `start={{ x: 0, y: 0 }}`, `end={{ x: 1, y: 0 }}`
2. **Vertical** (top to bottom): `start={{ x: 0, y: 0 }}`, `end={{ x: 0, y: 1 }}`
3. **Diagonal** (top-left to bottom-right): `start={{ x: 0, y: 0 }}`, `end={{ x: 1, y: 1 }}`

To change the direction, modify the `LinearGradient` component in `LibraryArticle.tsx`:

```tsx
<LinearGradient
  colors={safeGradientColors}
  start={{ x: 0, y: 0 }}  // Start point (0-1)
  end={{ x: 1, y: 1 }}     // End point (0-1)
  style={...}
/>
```

## Best Practices

1. **Always provide a fallback**: Include `pageBackground` or `backgroundColor` in case gradient fails
2. **Use consistent color schemes**: Match gradient colors with your design system
3. **Test on different devices**: Gradients may render differently on various screens
4. **Consider accessibility**: Ensure text remains readable over gradient backgrounds
5. **Performance**: Gradients are slightly more expensive than solid colors, but the difference is negligible

## Example: Complete Block Metadata

```json
{
  "align": "center",
  "justify": "center",
  "padding": 32,
  "fontSize": 18,
  "textAlign": "center",
  "textColor": "#2F3F4A",
  "headingColor": "#1A1A1A",
  "pageBackground": "#E8F4F8",
  "backgroundColor": "rgba(255,255,255,0.95)",
  "backgroundGradient": ["#E8F4F8", "#DDE8F8", "#D1D5DB"],
  "paddingVertical": 40,
  "paddingHorizontal": 28,
  "borderRadius": 24,
  "shadowColor": "#000000",
  "shadowOpacity": 0.1,
  "shadowRadius": 10
}
```

## Testing

After updating the database, test the gradient by:

1. Restart the API service
2. Fetch the article via API: `GET /api/library/articles/{slug}`
3. Verify `metadata.backgroundGradient` is present in the response
4. Check the frontend to see the gradient rendered

## Troubleshooting

- **Gradient not showing**: Check that `backgroundGradient` is an array with at least 2 valid color strings
- **Type errors**: Ensure colors are valid hex/rgb/rgba strings
- **Performance issues**: Limit the number of gradient colors (2-3 is optimal)

