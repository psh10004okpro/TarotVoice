# Cloudflare R2 Setup Guide

This guide explains how to set up Cloudflare R2 for CDN-based audio file storage with your TarotVoice API server.

## What is Cloudflare R2?

Cloudflare R2 is an S3-compatible object storage service that:
- **Zero egress fees**: No charges for bandwidth/data transfer
- **Global CDN**: Files served from Cloudflare's edge network worldwide
- **S3-compatible**: Works with existing S3 tools and libraries
- **Cost-effective**: 10GB free storage, then $0.015/GB/month

## Why Use R2 with Railway?

When deploying to Railway + R2:
- **Reduce Railway costs**: Files served directly from R2 CDN (no Railway bandwidth usage)
- **Better performance**: Cloudflare's global CDN is faster than serving from Railway
- **Persistent storage**: Railway's filesystem is ephemeral; R2 provides permanent storage
- **Scalability**: Handle thousands of concurrent streams without Railway load

## Prerequisites

- Cloudflare account (free tier available)
- Railway deployment (see RAILWAY_DEPLOYMENT.md)
- Credit card for Cloudflare R2 (free tier available, no charges unless you exceed it)

## Step 1: Create R2 Bucket

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com/
   - Navigate to **R2** in the left sidebar

2. **Create a Bucket**
   - Click **"Create bucket"**
   - **Bucket name**: `tarotvoice-audio` (or your preferred name)
   - **Location**: Choose **"Automatic"** for global distribution
   - Click **"Create bucket"**

3. **Configure Public Access** (Important!)
   - Click on your newly created bucket
   - Go to **Settings** tab
   - Scroll to **"Public Access"** section
   - Click **"Allow Access"** or **"Connect Domain"**

   **Option A: R2.dev subdomain (Easiest)**
   - Click **"Allow Access"**
   - Cloudflare will provide a public URL like: `https://tarotvoice-audio.1234567890abcdef.r2.dev`
   - Copy this domain for later use

   **Option B: Custom domain (Recommended for production)**
   - Click **"Connect Domain"**
   - Enter your domain: `cdn.yourdomain.com`
   - Add the CNAME record to your DNS settings as instructed
   - Wait for DNS propagation (usually 5-10 minutes)

## Step 2: Generate API Tokens

1. **Create R2 API Token**
   - In R2 dashboard, click **"Manage R2 API Tokens"**
   - Click **"Create API Token"**

2. **Token Configuration**
   - **Token name**: `tarotvoice-api-server`
   - **Permissions**: Select **"Object Read & Write"**
   - **TTL**: Leave blank (no expiration) or set as needed
   - **Specific bucket**: Select your `tarotvoice-audio` bucket
   - Click **"Create API Token"**

3. **Save Credentials** (Important - shown only once!)
   ```
   Access Key ID: abc123...
   Secret Access Key: xyz789...
   Account ID: 1234567890abcdef
   ```
   - **Copy these values immediately** - you won't see them again!

## Step 3: Configure Railway Environment Variables

1. **Go to Railway Project**
   - Open your Railway project dashboard
   - Click on your **tarotvoice-api-server** service
   - Go to **Variables** tab

2. **Add R2 Variables**
   Click **"New Variable"** and add each of these:

   ```bash
   # Enable R2 storage
   R2_ENABLED=true

   # Your R2 Account ID (from Step 2)
   R2_ACCOUNT_ID=1234567890abcdef

   # Your R2 Access Key ID (from Step 2)
   R2_ACCESS_KEY_ID=abc123...

   # Your R2 Secret Access Key (from Step 2)
   R2_SECRET_ACCESS_KEY=xyz789...

   # Your bucket name (from Step 1)
   R2_BUCKET_NAME=tarotvoice-audio

   # Your public domain (from Step 1)
   # Option A - R2.dev subdomain:
   R2_PUBLIC_DOMAIN=tarotvoice-audio.1234567890abcdef.r2.dev

   # Option B - Custom domain:
   R2_PUBLIC_DOMAIN=cdn.yourdomain.com
   ```

3. **Deploy**
   - Railway will automatically redeploy with new environment variables
   - Wait for deployment to complete

## Step 4: Verify Configuration

1. **Check Server Logs**
   - In Railway dashboard, go to **Deployments**
   - Click on the latest deployment
   - Check logs for: `✓ Cloudflare R2 client initialized successfully`

2. **Test Upload**
   ```bash
   # Upload a test audio file
   curl -X POST https://your-railway-app.up.railway.app/api/audio-manager/upload \
     -F "audio=@test.mp3" \
     -F "id=test-audio-001" \
     -F "title=Test Audio" \
     -F "description=Testing R2 upload"
   ```

3. **Check Response**
   ```json
   {
     "message": "Audio file uploaded successfully",
     "audio": {
       "id": "test-audio-001",
       "streamUrl": "https://cdn.yourdomain.com/audio-1234567890-123456789.mp3",
       "storage": "r2"
     }
   }
   ```
   - **Important**: `storage` should show `"r2"` (not `"local"`)
   - `streamUrl` should point to your R2 public domain

4. **Test Streaming**
   - Copy the `streamUrl` from the response
   - Open it in a browser or use curl:
   ```bash
   curl -I https://cdn.yourdomain.com/audio-1234567890-123456789.mp3
   ```
   - Should return `HTTP/2 200` with audio file headers

## Configuration Options

### Local Fallback

If R2 is not configured or fails to connect, the server automatically falls back to local storage:
- Files stored in `./uploads/audio/`
- Served through Railway (uses Railway bandwidth)
- Useful for development/testing

To disable R2 and use local storage:
```bash
R2_ENABLED=false
```

### Hybrid Approach

You can switch between R2 and local storage without code changes:
- **Development**: Use local storage (`R2_ENABLED=false`)
- **Production**: Use R2 (`R2_ENABLED=true`)

### Custom Domain vs R2.dev

**R2.dev subdomain** (Easier):
- ✓ Immediate setup (no DNS configuration)
- ✓ Free
- ✗ Generic URL
- ✗ Can't use with some corporate firewalls

**Custom domain** (Recommended):
- ✓ Professional URL
- ✓ Better branding
- ✓ Works everywhere
- ✗ Requires DNS configuration
- ✗ Takes 5-10 minutes for DNS propagation

## Cost Breakdown

### Cloudflare R2 Pricing
- **Storage**: 10GB free, then $0.015/GB/month
- **Class A operations** (writes): 1 million free, then $4.50/million
- **Class B operations** (reads): 10 million free, then $0.36/million
- **Egress**: **FREE** (no bandwidth charges)

### Example Monthly Cost
For 1000 audio files (100MB each):
- **Storage**: 100GB = 90GB × $0.015 = **$1.35**
- **Uploads**: 1000 files = minimal cost
- **Streams**: 100,000 streams = minimal cost (Class B operations)
- **Bandwidth**: Unlimited = **$0**
- **Total**: ~**$1.35/month**

Compare to Railway alone:
- **Bandwidth**: 100GB egress × $0.10/GB = **$10/month**
- **R2 saves**: ~$8.65/month at this scale

## Troubleshooting

### "R2 client initialization failed"

**Check credentials**:
```bash
# In Railway logs, look for:
Error initializing R2 client: ...
```

**Common issues**:
1. Wrong Account ID format
2. Invalid Access Key ID or Secret Access Key
3. Bucket doesn't exist
4. API token doesn't have write permissions

**Solution**: Double-check all environment variables match Step 2 values

### "403 Forbidden" when accessing files

**Issue**: Bucket is not public

**Solution**:
1. Go to R2 dashboard → Your bucket → Settings
2. Enable public access (see Step 1)
3. Make sure you're using the correct public domain

### Files upload but can't be accessed

**Issue**: Wrong `R2_PUBLIC_DOMAIN`

**Solution**:
1. Check your R2 bucket's public URL
2. Update `R2_PUBLIC_DOMAIN` in Railway variables
3. **Don't include** `https://` in the domain
4. **Correct**: `cdn.yourdomain.com`
5. **Wrong**: `https://cdn.yourdomain.com`

### Server uses local storage instead of R2

**Check logs**:
```bash
# Should see:
✓ Cloudflare R2 client initialized successfully

# If you see:
⚠ Cloudflare R2 credentials not fully configured
```

**Solution**:
1. Verify `R2_ENABLED=true` in Railway variables
2. Check all 5 R2 variables are set
3. Redeploy the service

### Custom domain not working

**DNS not propagated yet**:
- Wait 5-10 minutes after adding CNAME record
- Use `dig cdn.yourdomain.com` to check DNS

**Wrong CNAME record**:
- Must point to R2 endpoint (shown in Cloudflare dashboard)
- Format: `tarotvoice-audio.1234567890abcdef.r2.cloudflarestorage.com`

## Security Best Practices

1. **Keep API tokens secure**
   - Never commit tokens to git
   - Only add to Railway environment variables
   - Rotate tokens periodically

2. **Use custom domain in production**
   - More professional
   - Better security (can use WAF rules)

3. **Set bucket permissions correctly**
   - Enable public read for audio files
   - Keep API tokens with minimal permissions (Object Read & Write only)

4. **Monitor usage**
   - Check R2 dashboard for storage usage
   - Set up billing alerts in Cloudflare

## Migration Guide

### Moving existing local files to R2

If you already have files in local storage:

1. **Download all files from Railway**
   ```bash
   # Use API to get list of all files
   curl https://your-app.railway.app/api/audio-manager/list?limit=1000 > files.json

   # Download each file
   # (Script this based on your file list)
   ```

2. **Re-upload to R2**
   - Enable R2 in environment variables
   - Upload files again through the upload API
   - The system will automatically use R2

3. **Update database**
   - The new uploads will create new R2 entries
   - Old local file records will still work (served from local storage)
   - Gradually migrate by re-uploading important files

### Testing before production

1. **Test in Railway with local storage first**
2. **Set up R2 with test bucket**: `tarotvoice-audio-test`
3. **Upload test files and verify streaming works**
4. **Switch to production bucket when ready**

## Next Steps

- ✓ R2 configured and working
- [ ] Set up monitoring for R2 usage
- [ ] Configure CDN caching rules (optional)
- [ ] Set up file expiration policies (optional)
- [ ] Implement file backups from R2 (optional)

## Support

- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **Railway Support**: https://railway.app/help
- **API Server Issues**: Check server logs in Railway dashboard
