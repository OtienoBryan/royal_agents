# How to Verify Environment Variable is Working

## Check Browser Console

After deploying, open your Vercel app and check the browser console (F12). You should see:

```
🔧 [API] ==========================================
🔧 [API] API_BASE_URL: http://139.59.2.43:5007/api
🔧 [API] VITE_API_BASE_URL env: http://139.59.2.43:5007/api
🔧 [API] ==========================================
```

**If you see:**
- `API_BASE_URL: /api` → Environment variable is NOT set
- `VITE_API_BASE_URL env: (not set - using default /api)` → Environment variable is NOT set

## Verify in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click your project: **mc-aviation**
3. Go to: **Settings** → **Environment Variables**
4. Look for: `VITE_API_BASE_URL`
5. Check:
   - ✅ Value is: `http://139.59.2.43:5007/api` (no trailing slash)
   - ✅ It's enabled for: Production, Preview, Development
   - ✅ Status shows: "Available"

## Common Issues

### Issue 1: Variable Not Set for Production
- Make sure you selected **Production** when adding the variable
- Vercel requires you to select which environments to apply it to

### Issue 2: Wrong Variable Name
- Must be exactly: `VITE_API_BASE_URL` (case-sensitive)
- Must start with `VITE_` for Vite to expose it

### Issue 3: App Not Redeployed
- **Environment variables require a new deployment**
- After setting/updating, you MUST redeploy
- Go to Deployments → Click "Redeploy" on latest deployment

### Issue 4: Build Cache
- Sometimes Vercel caches builds
- Try: Settings → General → Clear Build Cache → Redeploy

## Quick Fix Steps

1. **Verify Variable Exists:**
   - Settings → Environment Variables
   - Should see `VITE_API_BASE_URL` with value `http://139.59.2.43:5007/api`

2. **If Missing, Add It:**
   - Click "Add New"
   - Key: `VITE_API_BASE_URL`
   - Value: `http://139.59.2.43:5007/api`
   - Select: Production, Preview, Development
   - Click "Save"

3. **Redeploy:**
   - Go to Deployments tab
   - Click 3 dots (...) on latest deployment
   - Click "Redeploy"
   - Wait for deployment to complete

4. **Verify:**
   - Open app in browser
   - Open Console (F12)
   - Check the logs - should show the full URL, not `/api`

## Alternative: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look at the failed request
5. **Request URL should be:**
   - ✅ `http://139.59.2.43:5007/api/auth/admin/login` (env var working)
   - ❌ `https://mc-aviation.vercel.app/api/auth/admin/login` (env var NOT working)
