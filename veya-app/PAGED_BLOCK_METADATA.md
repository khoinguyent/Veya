# Paged Block Metadata Reference

The `metadata` field in each block allows you to customize the appearance and behavior of individual paged blocks. Here's a comprehensive guide:

## Background & Page Styling

### `pageBackground` (string, hex color)
**Purpose**: Sets the background color for the entire page/slide when this block is active.
**Example**: `"#DDE8F8"` (light blue), `"#F6F1DF"` (cream)
**Default**: Falls back to `presentationConfig.pageBackground` or `#DDE8F8`

### `backgroundColor` (string, hex color)
**Purpose**: Sets the background color of the block container itself.
**Example**: `"#FFFFFF"`, `"rgba(255,255,255,0.9)"`
**Default**: Transparent or inherited from config

## Text Styling

### `textColor` (string, hex color)
**Purpose**: Color for body text (paragraphs, quotes, lists).
**Example**: `"#2F3F4A"` (dark gray), `"rgba(47, 63, 74, 0.72)"` (semi-transparent)
**Default**: `palette.textSecondary` (rgba(47, 63, 74, 0.72))

### `headingColor` (string, hex color)
**Purpose**: Color for headings and titles.
**Example**: `"#1A1A1A"` (black), `"#2F695C"` (dark green)
**Default**: `palette.textPrimary` (#2F3F4A)

### `strongColor` (string, hex color)
**Purpose**: Color for bold/emphasized text (`**text**` in markdown).
**Example**: `"#2F695C"` (accent green)
**Default**: Same as `headingColor`

### `textAlign` (string: "left" | "center" | "right")
**Purpose**: Horizontal alignment of text content.
**Example**: `"center"` (centered text)
**Default**: `"left"`

### `fontSize` (number)
**Purpose**: Custom font size in points (overrides default variant size).
**Example**: `18`, `20`
**Default**: Inherited from Typography variant

### `variant` (string)
**Purpose**: Typography variant override (only for `text`/`rich_text` blocks).
**Example**: `"h3"`, `"body"`, `"caption"`
**Default**: `"body"`

## Layout & Spacing

### `padding` (number)
**Purpose**: Uniform padding for all sides (shortcut for paddingVertical + paddingHorizontal).
**Example**: `24`, `32`
**Default**: `22` (from config) or `0`

### `paddingVertical` (number)
**Purpose**: Vertical padding (top and bottom).
**Example**: `32`, `40`
**Default**: Inherits from `padding` or config default

### `paddingHorizontal` (number)
**Purpose**: Horizontal padding (left and right).
**Example**: `24`, `28`
**Default**: Inherits from `padding` or config default

### `spacing` (number)
**Purpose**: Margin-bottom spacing after this block (only in single-page mode).
**Example**: `18`, `24`
**Default**: `18` (from config)

### `align` (string: "flex-start" | "center" | "flex-end" | "right" | "end")
**Purpose**: Horizontal alignment of the entire block container.
**Example**: `"center"` (centers block content)
**Default**: `"flex-start"`

### `justify` (string: "flex-start" | "center" | "flex-end" | "space-between")
**Purpose**: Vertical justification of content within the page (paged mode only).
**Example**: `"center"` (vertically centers content)
**Default**: `"center"` (for paged blocks)

## Border & Shadows

### `borderRadius` (number)
**Purpose**: Rounded corners for the block container or images.
**Example**: `24`, `28`, `32`
**Default**: `28` (for containers), `32` (for images), `24` (for illustrations)

### `shadowColor` (string, hex color)
**Purpose**: Shadow color (enables shadow if provided).
**Example**: `"#000000"`, `"rgba(0,0,0,0.12)"`
**Default**: No shadow unless provided

### `shadowOpacity` (number, 0-1)
**Purpose**: Shadow opacity/transparency.
**Example**: `0.18`, `0.25`
**Default**: `0.18`

### `shadowRadius` (number)
**Purpose**: Shadow blur radius.
**Example**: `12`, `18`, `24`
**Default**: `18`

### `shadowOffset` (object: `{ width: number, height: number }`)
**Purpose**: Shadow offset from the block.
**Example**: `{ width: 0, height: 10 }`
**Default**: `{ width: 0, height: 10 }`

### `elevation` (number, Android only)
**Purpose**: Material elevation (Android shadow depth).
**Example**: `6`, `8`
**Default**: `6`

## Image Styling

### `url` or `imageUrl` (string)
**Purpose**: Image URL override (if different from `payload.url`).
**Example**: `"https://example.com/image.jpg"`
**Default**: Uses `block.payload.url` or `block.payload.image_url`

### `height` (number)
**Purpose**: Image height in pixels or percentage of screen width.
**Example**: `300`, `SCREEN_WIDTH * 0.55`
**Default**: `SCREEN_WIDTH * 0.55` (55% of screen width)

### `resizeMode` (string: "cover" | "contain" | "stretch")
**Purpose**: How the image should be resized to fit its container.
**Example**: `"contain"` (fit entire image), `"cover"` (fill container)
**Default**: `"cover"` (for images), `"contain"` (for illustrations)

### `overlayColor` (string, hex color with alpha)
**Purpose**: Color overlay on top of the image.
**Example**: `"rgba(0,0,0,0.15)"` (dark overlay), `"rgba(255,255,255,0.2)"` (light overlay)
**Default**: No overlay

### `caption` (string)
**Purpose**: Caption text displayed below the image.
**Example**: `"Hold the pause lightly."`
**Default**: No caption

### `captionColor` (string, hex color)
**Purpose**: Caption text color.
**Example**: `"rgba(47, 63, 74, 0.45)"`
**Default**: `palette.muted` (rgba(47, 63, 74, 0.45))

## List Styling

### `bulletColor` (string, hex color)
**Purpose**: Color of bullet points in list blocks.
**Example**: `"#7796AF"` (accent blue)
**Default**: `palette.primary` (#7796AF)

## Hero Block Specific

### `titleColor` (string, hex color)
**Purpose**: Hero title text color.
**Example**: `"#2F3F4A"`
**Default**: `palette.textPrimary`

### `subtitleColor` (string, hex color)
**Purpose**: Hero subtitle text color.
**Example**: `"rgba(47, 63, 74, 0.72)"`
**Default**: `palette.textSecondary`

## Tips Block Styling

### `accentColor` (string, hex color)
**Purpose**: Accent color for tip card borders and headings.
**Example**: `"#7796AF"` (blue), `"#5C8B70"` (green)
**Default**: `palette.primary`

### `cardBackground` (string, hex color)
**Purpose**: Background color for tip cards.
**Example**: `"rgba(255,255,255,0.9)"` (semi-transparent white)
**Default**: `"rgba(255,255,255,0.9)"`

### `borderColor` (string, hex color)
**Purpose**: Border color for tip cards.
**Example**: `"#7796AF"`
**Default**: Same as `accentColor`

## CTA/Button Block Styling

### `buttonColor` (string, hex color)
**Purpose**: Background color of the CTA button.
**Example**: `"#7796AF"` (blue), `"#5C8B70"` (green)
**Default**: `palette.primary` or article accent color

### `label` (string)
**Purpose**: Button label text (if different from `payload.label`).
**Example**: `"Continue"`, `"Start Practice"`
**Default**: Uses `payload.label` or `"Continue"`

### `description` (string)
**Purpose**: Description text above the button.
**Example**: `"Ready to begin your practice?"`
**Default**: No description

### `onPress` (function, frontend only)
**Purpose**: Custom action when button is pressed (not supported in backend metadata).
**Note**: This is a frontend-only property and cannot be set via API.

## Complete Example

Here's an example of a fully styled paged block:

```json
{
  "position": 7,
  "block_type": "text",
  "payload": {
    "body": "When anxious loops return, picture this ladder: inhale up, pause to observe, exhale down.",
    "heading": "Integration"
  },
  "metadata": {
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
    "borderRadius": 24,
    "fontSize": 18,
    "shadowColor": "rgba(0,0,0,0.1)",
    "shadowOpacity": 0.12,
    "shadowRadius": 16,
    "shadowOffset": {
      "width": 0,
      "height": 8
    },
    "elevation": 4
  }
}
```

## Minimal Example

For most cases, you only need a few key fields:

```json
{
  "position": 7,
  "block_type": "text",
  "payload": {
    "body": "When anxious loops return, picture this ladder: inhale up, pause to observe, exhale down.",
    "heading": "Integration"
  },
  "metadata": {
    "pageBackground": "#DDE8F8",
    "textAlign": "center"
  }
}
```

## Notes

1. **Inheritance**: Most metadata fields fall back to `presentationConfig` values if not specified.
2. **Paged vs Single-Page**: Some fields (like `justify`) only apply in paged mode.
3. **Color Format**: Use hex colors (`#RRGGBB`) or rgba strings (`rgba(r,g,b,a)`).
4. **Image URLs**: Can be provided in `metadata.url`, `metadata.imageUrl`, or `payload.url`/`payload.image_url`.
5. **Empty Metadata**: An empty `metadata: {}` object is valid and will use all default values.

