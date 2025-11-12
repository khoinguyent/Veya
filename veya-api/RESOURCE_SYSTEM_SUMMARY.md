# Resource Management System Summary

## Overview

Complete solution for managing media assets (illustrations, sounds, images, etc.) stored in Cloudflare R2 with API endpoints and frontend integration.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│  API Server  │─────▶│  Cloudflare │
│  (React)    │      │   (FastAPI)  │      │     R2      │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  PostgreSQL  │
                     │  (Metadata)  │
                     └──────────────┘
```

## Database Schema

### Resources Table

- **id** (UUID): Primary key
- **name** (String): Human-readable name
- **slug** (String, unique): URL-friendly identifier
- **description** (String, optional): Description
- **resource_type** (Enum): illustration, sound, image, video, audio, document, other
- **category** (Enum): onboarding, home, profile, meditation, mood, background, icon, other
- **r2_key** (String): Path in R2 bucket
- **public_url** (String): Public CDN URL
- **file_size, width, height, duration** (optional): File metadata
- **tags** (JSON array): Tags for searching
- **metadata** (JSON object): Additional metadata
- **is_active, is_public** (Boolean): Status flags

## Resource Identification Methods

### 1. By Slug (Recommended)
```typescript
GET /api/resources/relaxed-illustration
```
- Human-readable
- URL-friendly
- Easy to remember

### 2. By ID (UUID)
```typescript
GET /api/resources/550e8400-e29b-41d4-a716-446655440000
```
- Unique identifier
- Database primary key

### 3. By Category + Type
```typescript
GET /api/resources/by-category/onboarding?resource_type=illustration
```
- Filter by category
- Filter by type

### 4. By Tags
```typescript
GET /api/resources?tags=relaxed,mood
```
- Search by tags
- Multiple tags supported

## API Endpoints

### Public Endpoints (No Auth Required)

1. **List Resources**
   ```
   GET /api/resources?category=onboarding&resource_type=illustration&page=1
   ```

2. **Get Resource**
   ```
   GET /api/resources/{slug}
   GET /api/resources/{uuid}
   ```

3. **Get Resource URL**
   ```
   GET /api/resources/{slug}/url?presigned=false
   ```

4. **Get by Category**
   ```
   GET /api/resources/by-category/{category}
   ```

### Admin Endpoints (Auth Required)

1. **Upload Resource**
   ```
   POST /api/resources/upload
   Content-Type: multipart/form-data
   ```

2. **Update Resource**
   ```
   PUT /api/resources/{resource_id}
   ```

3. **Delete Resource**
   ```
   DELETE /api/resources/{resource_id}?delete_file=true
   ```

## File Organization in R2

```
veya-assets/
  ├── onboarding/
  │   ├── illustration/
  │   │   ├── relaxed-illustration.svg
  │   │   ├── happy-illustration.svg
  │   │   └── calm-illustration.svg
  │   └── sound/
  │       └── onboarding-music.mp3
  ├── home/
  │   ├── illustration/
  │   └── image/
  └── profile/
      └── illustration/
```

**R2 Key Format**: `{category}/{resource_type}/{slug}.{extension}`

## Frontend Integration

### Quick Example

```typescript
// 1. Fetch resource by slug
const resource = await fetch(`${API_BASE}/api/resources/relaxed-illustration`)
  .then(r => r.json());

// 2. Use public_url
<Image source={{ uri: resource.public_url }} />
```

### Using Resource Component

```typescript
import { ResourceImage } from './components/ResourceImage';

<ResourceImage 
  slug="relaxed-illustration" 
  width={300} 
  height={300}
/>
```

## Setup Checklist

- [ ] Create Cloudflare R2 bucket
- [ ] Get R2 API credentials
- [ ] Configure R2 public access (or custom domain)
- [ ] Add R2 credentials to `.env`
- [ ] Install dependencies: `boto3`, `botocore`
- [ ] Restart backend API
- [ ] Test upload: `POST /api/resources/upload`
- [ ] Test retrieval: `GET /api/resources/{slug}`
- [ ] Update frontend to use resource API

## Environment Variables

```bash
# .env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=veya-assets
R2_PUBLIC_DOMAIN=assets.veya.app  # Optional
```

## Example: Upload Illustration

```bash
curl -X POST "http://localhost:8000/api/resources/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@relaxed.svg" \
  -F "name=Relaxed Illustration" \
  -F "slug=relaxed-illustration" \
  -F "resource_type=illustration" \
  -F "category=onboarding" \
  -F "tags=relaxed,mood,onboarding" \
  -F "is_public=true"
```

## Example: Retrieve Resource

```bash
# Get resource metadata
curl "http://localhost:8000/api/resources/relaxed-illustration"

# Get resource URL
curl "http://localhost:8000/api/resources/relaxed-illustration/url"
```

## Frontend Migration

### Before (Local Files)
```typescript
import relaxedIllustration from '../assets/illustrations/relaxed.svg';
<Image source={relaxedIllustration} />
```

### After (R2 Resources)
```typescript
<ResourceImage slug="relaxed-illustration" />
```

## Benefits

1. **Centralized Storage**: All assets in one place (Cloudflare R2)
2. **CDN Performance**: Fast global delivery via Cloudflare CDN
3. **Dynamic Management**: Add/remove resources without app updates
4. **Versioning**: Track resource usage and changes
5. **Scalability**: Handle unlimited resources
6. **Cost Effective**: Pay only for storage and operations

## Files Created

1. `app/models/resource.py` - Resource database model
2. `app/schemas/resource.py` - Resource API schemas
3. `app/api/routes/resources.py` - Resource API routes
4. `app/core/r2_client.py` - Cloudflare R2 client
5. `RESOURCE_MANAGEMENT.md` - Complete documentation
6. `FRONTEND_RESOURCE_INTEGRATION.md` - Frontend guide
7. `R2_SETUP_GUIDE.md` - R2 setup instructions
8. `RESOURCE_SYSTEM_SUMMARY.md` - This summary

## Next Steps

1. Set up Cloudflare R2 bucket
2. Configure R2 credentials
3. Upload existing assets
4. Update frontend components
5. Test resource loading
6. Deploy to production

