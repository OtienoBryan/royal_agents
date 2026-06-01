# Fix 500 Error - Set Environment Variable in Vercel

## Problem
- Direct API calls to `http://139.59.2.43:5007` work perfectly (Status 201)
- Vercel proxy returns 500 Internal Server Error
- Backend fails when handling proxied requests

## Solution: Bypass Vercel Proxy

Set an environment variable to make direct API calls from the browser.

### Step-by-Step Instructions

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Click on your project: `mc-aviation`

2. **Navigate to Settings**
   - Click on "Settings" tab at the top
   - Click on "Environment Variables" in the left sidebar

3. **Add Environment Variable**
   - Click "Add New" button
   - Fill in:
     - **Key**: `VITE_API_BASE_URL`
     - **Value**: `http://139.59.2.43:5007/api`
   - Select environments:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Click "Save"

4. **Redeploy**
   - Go to "Deployments" tab
   - Click the 3 dots (...) on the latest deployment
   - Click "Redeploy"
   - Or just push a new commit to trigger deployment

### What This Does

Your app will now:
- Make API calls directly to `http://139.59.2.43:5007/api`
- Bypass Vercel's proxy completely
- Use the same endpoint that works in our tests

### Important: Configure CORS

Your backend must allow requests from Vercel. Add to your backend CORS config:

```javascript
// Example for Express.js
app.use(cors({
  origin: [
    'https://mc-aviation.vercel.app',
    'http://localhost:3002'  // for local dev
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'X-Requested-With']
}));
```

### Verification

After redeploying:
1. Open: https://mc-aviation.vercel.app
2. Try logging in with:
   - Email: `admin@royal.com`
   - Password: `admin123`
3. Check browser console - should see successful requests

### Alternative: Debug Backend 500 Error

If you prefer to keep using the proxy, check your backend logs to see why it's returning 500 for proxied requests. The issue is on the backend side, not the Vercel configuration.
