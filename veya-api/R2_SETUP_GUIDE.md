# Cloudflare R2 Setup Guide

## Overview

This guide explains how to set up Cloudflare R2 for storing media assets (illustrations, sounds, images, etc.) for the Veya app.

## Step 1: Create R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **R2** → **Create bucket**
3. Name your bucket (e.g., `veya-assets`)
4. Choose a location (closest to your users)
5. Click **Create bucket**

## Step 2: Get R2 API Credentials

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Fill in:
   - **Token name**: `veya-api-token`
   - **Permissions**: Object Read & Write
   - **TTL**: Optional (or leave blank for no expiration)
   - **Bucket access**: Select your bucket (`veya-assets`)
4. Click **Create API token**
5. **Copy and save**:
   - Account ID
   - Access Key ID
   - Secret Access Key

## Step 3: Configure Public Access (Optional but Recommended)

### Option A: Custom Domain (Recommended)

1. Go to your R2 bucket → **Settings** → **Public Access**
2. Click **Connect Domain**
3. Add your custom domain (e.g., `assets.veya.app`)
4. Follow DNS setup instructions
5. Once connected, files will be accessible via: `https://assets.veya.app/{file-path}`

### Option B: R2 Public URL

1. Go to your R2 bucket → **Settings** → **Public Access**
2. Enable **Public Access**
3. Files will be accessible via: `https://pub-{account-id}.r2.dev/{bucket-name}/{file-path}`

## Step 4: Configure Backend

Add these environment variables to your `.env` file:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=veya-assets
R2_PUBLIC_DOMAIN=assets.veya.app  # Optional: if using custom domain
```

## Step 5: Test Upload

### Using API (Swagger UI)

1. Go to http://localhost:8000/docs
2. Find `POST /api/resources/upload`
3. Click "Try it out"
4. Fill in the form:
   - **file**: Select a file (e.g., SVG illustration)
   - **name**: "Test Illustration"
   - **slug**: "test-illustration"
   - **resource_type**: "illustration"
   - **category**: "onboarding"
   - **tags**: "test"
   - **is_public**: true
5. Click "Execute"
6. Check the response for the `public_url`

### Using cURL

```bash
curl -X POST "http://localhost:8000/api/resources/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/illustration.svg" \
  -F "name=Test Illustration" \
  -F "slug=test-illustration" \
  -F "resource_type=illustration" \
  -F "category=onboarding" \
  -F "tags=test" \
  -F "is_public=true"
```

## Step 6: Verify Upload

1. Check Cloudflare R2 dashboard → Your bucket
2. You should see the file: `onboarding/illustration/test-illustration.svg`
3. Test the public URL in a browser

## File Organization in R2

Files are organized by category and type:

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

**R2 Key Format**: `{category}/{resource_type}/{slug}.{extension}`

## Resource Identification

Resources can be identified by:

1. **Slug** (Recommended for frontend):
   - Human-readable: `relaxed-illustration`
   - URL-friendly identifier
   - Example: `GET /api/resources/relaxed-illustration`

2. **ID** (UUID):
   - Database primary key
   - Example: `GET /api/resources/550e8400-e29b-41d4-a716-446655440000`

3. **Category + Type**:
   - Filter resources by category and type
   - Example: `GET /api/resources/by-category/onboarding?resource_type=illustration`

## Frontend Usage

### React Native Example

```typescript
// Fetch resource by slug
const fetchIllustration = async (slug: string) => {
  const response = await fetch(`${API_BASE}/api/resources/${slug}`);
  const resource = await response.json();
  
  // Use the public_url
  return resource.public_url;
};

// Load image
const url = await fetchIllustration('relaxed-illustration');
<Image source={{ uri: url }} />
```

### Resource Component

See `FRONTEND_RESOURCE_INTEGRATION.md` for complete examples.

## Troubleshooting

### Issue: "R2 credentials not configured"

**Solution**: Make sure all R2 environment variables are set in `.env`:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

### Issue: "Failed to upload file to R2"

**Solutions**:
1. Check R2 credentials are correct
2. Verify bucket name matches
3. Check bucket permissions (API token needs Write access)
4. Verify R2 service is accessible

### Issue: "File not accessible via public URL"

**Solutions**:
1. Enable public access in R2 bucket settings
2. Or use presigned URLs: `GET /api/resources/{slug}/url?presigned=true`
3. Check custom domain DNS settings (if using custom domain)

### Issue: CORS errors when loading resources

**Solution**: Configure CORS in R2 bucket:
1. Go to R2 bucket → **Settings** → **CORS Policy**
2. Add CORS rule:
   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": [],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

## Cost Considerations

- **Storage**: $0.015 per GB/month
- **Class A Operations** (writes): $4.50 per million
- **Class B Operations** (reads): $0.36 per million
- **Egress**: Free (unlimited)

## Security Best Practices

1. **Use Environment Variables**: Never commit R2 credentials to git
2. **Restrict API Token Permissions**: Only grant necessary permissions
3. **Use Presigned URLs**: For private resources, use presigned URLs
4. **Custom Domain**: Use custom domain with SSL for better security
5. **Bucket Policies**: Configure bucket policies to restrict access if needed

## Next Steps

1. Upload existing assets to R2
2. Update frontend to use resource API
3. Test resource loading in app
4. Monitor R2 usage and costs

