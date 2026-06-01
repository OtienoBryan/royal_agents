# Fix 500 Error - Step by Step

## Current Situation
- Request URL: `https://mc-aviation.vercel.app/api/auth/admin/login` ❌
- Should be: `http://139.59.2.43:5007/api/auth/admin/login` ✅
- This means environment variable is NOT being used

## Solution 1: Verify Environment Variable (Do This First)

### Step 1: Check Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Click: **mc-aviation** project
3. Go to: **Settings** → **Environment Variables**
4. **Look for:** `VITE_API_BASE_URL`
5. **If it exists:**
   - Check the value is: `http://139.59.2.43:5007/api`
   - Check it's enabled for **Production**
   - If wrong, click Edit and fix it
6. **If it doesn't exist:**
   - Click "Add New"
   - Key: `VITE_API_BASE_URL`
   - Value: `http://139.59.2.43:5007/api`
   - Select: ✅ Production, ✅ Preview, ✅ Development
   - Click "Save"

### Step 2: Clear Build Cache and Redeploy
1. Go to: **Settings** → **General**
2. Scroll to "Build & Development Settings"
3. Click "Clear Build Cache"
4. Go to: **Deployments** tab
5. Click the 3 dots (...) on latest deployment
6. Click "Redeploy"
7. **Wait for deployment to complete** (2-3 minutes)

### Step 3: Verify It's Working
1. Open: https://mc-aviation.vercel.app
2. Press F12 → **Console** tab
3. Look for logs starting with `🔧 [API]`
4. Should show: `API_BASE_URL: http://139.59.2.43:5007/api`
5. If it shows `/api`, the env var is still not working

## Solution 2: Check Browser Console Logs

After redeploying, check the console. You should see:

```
🔧 [API] ==========================================
🔧 [API] API_BASE_URL: http://139.59.2.43:5007/api
🔧 [API] VITE_API_BASE_URL env: http://139.59.2.43:5007/api
🔧 [API] ==========================================
```

**If you see:**
- `API_BASE_URL: /api` → Env var not set
- `VITE_API_BASE_URL env: (not set - using default /api)` → Env var not set

## Solution 3: Fix Backend to Handle Proxy (Alternative)

If environment variable approach doesn't work, fix your backend to handle proxied requests:

### Check Backend Logs
When the 500 error occurs, check your backend server logs at `139.59.2.43:5007` to see:
- What error is happening
- What request is being received
- Why it's failing

### Common Backend Issues:
1. **CORS not configured** - Add `https://mc-aviation.vercel.app` to allowed origins
2. **Header validation** - Backend might be checking headers that Vercel modifies
3. **Request format** - Backend might expect different request format

### Backend CORS Fix (Express.js example):
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://mc-aviation.vercel.app',
    'http://localhost:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'X-Requested-With']
}));
```

## Solution 4: Temporary Hardcode (For Testing Only)

If nothing else works, you can temporarily hardcode the URL in `api.ts`:

```typescript
// TEMPORARY - Remove after fixing env var
const API_BASE_URL = 'http://139.59.2.43:5007/api'
```

**⚠️ WARNING:** This is only for testing. Don't commit this to production.

## What to Do Right Now

1. **Check Vercel Environment Variables** (Solution 1, Step 1)
2. **Clear cache and redeploy** (Solution 1, Step 2)
3. **Check console logs** (Solution 2)
4. **If still not working, check backend logs** (Solution 3)

## Most Likely Issue

The environment variable is either:
- Not set correctly in Vercel
- Not enabled for Production environment
- App wasn't redeployed after setting it
- Build cache needs to be cleared
