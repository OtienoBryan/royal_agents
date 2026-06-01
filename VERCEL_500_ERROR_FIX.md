# Fixing 500 Error with Vercel Proxy

## Problem
- Direct API calls work (Status 201)
- Vercel proxy returns 500 Internal Server Error
- Server is accessible but proxy configuration has issues

## Solution Options

### Option 1: Use Direct API Calls (Recommended)

Instead of using Vercel rewrites, make direct API calls from the browser:

1. **Set Environment Variable in Vercel:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add: `VITE_API_BASE_URL` = `http://139.59.2.43:5007/api`
   - Apply to: Production, Preview, Development

2. **Update vercel.json** (remove API rewrite):
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

3. **Configure CORS on Backend:**
   Your backend must allow requests from `https://mc-aviation.vercel.app`

### Option 2: Fix Vercel Proxy Configuration

The 500 error might be caused by:
- Missing or incorrect headers
- Request body not being forwarded correctly
- Backend expecting specific headers

**Updated vercel.json** includes:
- Proper forwarding headers
- X-Forwarded-Host and X-Forwarded-Proto headers
- CORS headers for browser requests

### Option 3: Check Backend Logs

The 500 error is coming from your backend. Check:
1. Backend server logs for the actual error
2. What headers/body the backend is receiving
3. If the backend expects specific request format

## Testing

After making changes:
1. Redeploy on Vercel
2. Test login with: `admin@royal.com` / `admin123`
3. Check browser Network tab for request/response details
4. Check backend logs for incoming requests

## Current Status

✅ Server is accessible (direct calls work)
✅ Login endpoint works (returns 201 with token)
❌ Vercel proxy returns 500 (backend error when proxied)

The issue is likely in how the backend handles proxied requests vs direct requests.
