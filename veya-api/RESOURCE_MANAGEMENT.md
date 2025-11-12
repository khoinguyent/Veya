# Resource Management with Cloudflare R2

## Overview

This system manages media assets (illustrations, sounds, images, etc.) stored in Cloudflare R2. Resources are identified by:
- **ID**: UUID (unique database identifier)
- **Slug**: URL-friendly identifier (e.g., "relaxed-illustration")
- **Name**: Human-readable name
- **URL**: Public or presigned URL for accessing the file

## Setup

### 1. Cloudflare R2 Configuration

Add these environment variables to your `.env` file:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=veya-assets
R2_PUBLIC_DOMAIN=assets.veya.app  # Optional: Custom domain
```

### 2. R2 Bucket Setup

1. Create a bucket in Cloudflare R2
2. Enable public access (or use presigned URLs)
3. Optionally set up a custom domain
4. Get your API credentials (Account ID, Access Key, Secret Key)

## Database Schema

### Resource Table

```sql
CREATE TABLE resources (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,
    description TEXT,
    resource_type VARCHAR NOT NULL,  -- illustration, sound, image, etc.
    category VARCHAR NOT NULL,        -- onboarding, home, profile, etc.
    mime_type VARCHAR,
    file_extension VARCHAR,
    r2_key VARCHAR UNIQUE NOT NULL,   -- Path in R2 bucket
    r2_bucket VARCHAR NOT NULL,
    public_url VARCHAR NOT NULL,
    file_size INTEGER,
    width INTEGER,                    -- For images/videos
    height INTEGER,                   -- For images/videos
    duration FLOAT,                   -- For audio/video
    tags JSON,                        -- Array of tags
    metadata JSON,                    -- Additional metadata
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    uploaded_at TIMESTAMP
);
```

## API Endpoints

### Upload Resource

```bash
POST /api/resources/upload
Content-Type: multipart/form-data

Form data:
- file: (binary) The file to upload
- name: "Relaxed Illustration"
- slug: "relaxed-illustration"
- description: "Illustration for relaxed mood"
- resource_type: "illustration"
- category: "onboarding"
- tags: "relaxed,mood,illustration" (comma-separated)
- is_public: true

Response:
{
  "resource": {
    "id": "...",
    "name": "Relaxed Illustration",
    "slug": "relaxed-illustration",
    "public_url": "https://assets.veya.app/onboarding/illustration/relaxed-illustration.svg",
    ...
  },
  "message": "Resource uploaded successfully"
}
```

### List Resources

```bash
GET /api/resources?category=onboarding&resource_type=illustration&page=1&page_size=50

Query parameters:
- category: onboarding, home, profile, etc.
- resource_type: illustration, sound, image, etc.
- is_active: true/false
- search: Search in name, description, slug
- tags: Comma-separated tags
- page: Page number (default: 1)
- page_size: Items per page (default: 50, max: 100)

Response:
{
  "resources": [...],
  "total": 100,
  "page": 1,
  "page_size": 50
}
```

### Get Resource by ID or Slug

```bash
GET /api/resources/{identifier}

# By UUID
GET /api/resources/550e8400-e29b-41d4-a716-446655440000

# By slug
GET /api/resources/relaxed-illustration

Response:
{
  "id": "...",
  "name": "Relaxed Illustration",
  "slug": "relaxed-illustration",
  "public_url": "https://assets.veya.app/...",
  ...
}
```

### Get Resource URL

```bash
GET /api/resources/{identifier}/url?presigned=false&expiration=3600

Query parameters:
- presigned: Generate presigned URL (default: false)
- expiration: Presigned URL expiration in seconds (default: 3600)

Response:
{
  "url": "https://assets.veya.app/...",
  "type": "public"  # or "presigned"
}
```

### Get Resources by Category

```bash
GET /api/resources/by-category/{category}?resource_type=illustration

Response:
[
  {
    "id": "...",
    "name": "...",
    "public_url": "...",
    ...
  },
  ...
]
```

### Update Resource

```bash
PUT /api/resources/{resource_id}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "tags": ["tag1", "tag2"],
  "is_active": true
}
```

### Delete Resource

```bash
DELETE /api/resources/{resource_id}?delete_file=true

Query parameters:
- delete_file: Delete file from R2 (default: true)
```

## Resource Identification

### Methods to Identify Resources

1. **By ID (UUID)**: `550e8400-e29b-41d4-a716-446655440000`
2. **By Slug**: `relaxed-illustration`
3. **By Category + Type**: Filter by category and resource type
4. **By Tags**: Filter by tags

### Resource Types

- `illustration` - SVG, PNG illustrations
- `sound` - Audio files (MP3, WAV, etc.)
- `image` - Images (PNG, JPG, etc.)
- `video` - Video files
- `audio` - Audio files
- `document` - PDFs, etc.
- `other` - Other file types

### Resource Categories

- `onboarding` - Onboarding screens
- `home` - Home screen
- `profile` - Profile screen
- `meditation` - Meditation sessions
- `mood` - Mood-related resources
- `background` - Background images
- `icon` - Icons
- `other` - Other categories

## Frontend Integration

### 1. Fetch Resource by Slug

```typescript
// React Native example
const fetchResource = async (slug: string) => {
  const response = await fetch(`${API_BASE}/api/resources/${slug}`);
  const resource = await response.json();
  return resource.public_url;
};

// Usage
const illustrationUrl = await fetchResource('relaxed-illustration');
```

### 2. Load Image/Illustration

```typescript
import { Image } from 'react-native';

// Fetch resource
const resource = await fetch(`${API_BASE}/api/resources/relaxed-illustration`).then(r => r.json());

// For SVG (need react-native-svg)
import SvgUri from 'react-native-svg-uri';

<SvgUri
  width="200"
  height="200"
  source={{ uri: resource.public_url }}
/>

// For PNG/JPG
<Image
  source={{ uri: resource.public_url }}
  style={{ width: 200, height: 200 }}
  resizeMode="contain"
/>
```

### 3. Load Audio/Sound

```typescript
import { Audio } from 'expo-av';

const loadSound = async (slug: string) => {
  // Get resource URL
  const resource = await fetch(`${API_BASE}/api/resources/${slug}`).then(r => r.json());
  
  // Load audio
  const { sound } = await Audio.Sound.createAsync(
    { uri: resource.public_url }
  );
  
  return sound;
};
```

### 4. Resource Component Helper

```typescript
// components/ResourceImage.tsx
import React, { useEffect, useState } from 'react';
import { Image, View, ActivityIndicator } from 'react-native';
import SvgUri from 'react-native-svg-uri';

interface ResourceImageProps {
  slug: string;
  width?: number;
  height?: number;
  resizeMode?: 'contain' | 'cover' | 'stretch';
}

export const ResourceImage: React.FC<ResourceImageProps> = ({
  slug,
  width = 200,
  height = 200,
  resizeMode = 'contain',
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/resources/${slug}`)
      .then(res => res.json())
      .then(resource => {
        setUrl(resource.public_url);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load resource:', error);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!url) {
    return null;
  }

  // Check if SVG
  if (url.endsWith('.svg')) {
    return (
      <SvgUri
        width={width}
        height={height}
        source={{ uri: url }}
      />
    );
  }

  // Regular image
  return (
    <Image
      source={{ uri: url }}
      style={{ width, height }}
      resizeMode={resizeMode}
    />
  );
};

// Usage
<ResourceImage slug="relaxed-illustration" width={300} height={300} />
```

### 5. Resource List Component

```typescript
// Fetch resources by category
const fetchResourcesByCategory = async (category: string) => {
  const response = await fetch(
    `${API_BASE}/api/resources/by-category/${category}?resource_type=illustration`
  );
  return await response.json();
};

// Usage
const onboardingIllustrations = await fetchResourcesByCategory('onboarding');
```

### 6. Caching Resources

```typescript
// Cache resource URLs to avoid repeated API calls
const resourceCache = new Map<string, string>();

const getResourceUrl = async (slug: string): Promise<string> => {
  if (resourceCache.has(slug)) {
    return resourceCache.get(slug)!;
  }

  const resource = await fetch(`${API_BASE}/api/resources/${slug}`).then(r => r.json());
  resourceCache.set(slug, resource.public_url);
  return resource.public_url;
};
```

## R2 File Organization

Files are organized in R2 as:

```
veya-assets/
  ├── onboarding/
  │   ├── illustration/
  │   │   ├── relaxed-illustration.svg
  │   │   ├── happy-illustration.svg
  │   │   └── ...
  │   └── sound/
  │       └── ...
  ├── home/
  │   ├── illustration/
  │   └── ...
  └── ...
```

R2 Key format: `{category}/{resource_type}/{slug}.{extension}`

## Best Practices

1. **Use Slugs**: Use human-readable slugs instead of UUIDs in frontend
2. **Cache URLs**: Cache resource URLs to reduce API calls
3. **Lazy Loading**: Load resources on-demand, not all at once
4. **Error Handling**: Handle missing resources gracefully
5. **CDN**: Use custom domain with CDN for better performance
6. **Presigned URLs**: Use presigned URLs for private resources
7. **Tags**: Use tags for easy filtering and search

## Migration from Local Files

1. Upload existing files to R2 using the upload endpoint
2. Update frontend code to fetch resources from API
3. Replace local file paths with resource slugs
4. Test all resource loading

## Example: Migrating Illustration

**Before:**
```typescript
import relaxedIllustration from '../assets/illustrations/relaxed.svg';
<Image source={relaxedIllustration} />
```

**After:**
```typescript
const [url, setUrl] = useState<string | null>(null);

useEffect(() => {
  fetch(`${API_BASE}/api/resources/relaxed-illustration`)
    .then(res => res.json())
    .then(resource => setUrl(resource.public_url));
}, []);

{url && <SvgUri source={{ uri: url }} />}
```

Or using the helper component:
```typescript
<ResourceImage slug="relaxed-illustration" />
```

