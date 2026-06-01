# Fix 502 Error - Quick Solution

## The Problem

Vercel cannot connect to your backend at `http://139.59.2.43:5007` because:
- The server might not be publicly accessible
- Vercel prefers HTTPS connections
- Network/firewall restrictions

## Solution: Use Direct API Calls (Recommended)

Instead of using Vercel rewrites (which require the backend to be accessible from Vercel's servers), make direct API calls from the browser.

### Step 1: Update vercel.json

Remove the API rewrite and keep only the SPA routing:

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

### Step 2: Set Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `http://139.59.2.43:5007/api` (or `https://...` if you have SSL)
   - **Environment**: Production, Preview, Development (select all)

### Step 3: Configure CORS on Your Backend

Your backend MUST allow requests from your Vercel domain. Add CORS headers:

**If using Express/Node.js:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'https://your-app.vercel.app',
    'https://your-custom-domain.com',
    'http://localhost:3002' // for local development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'X-Requested-With']
}));
```

**If using NestJS:**
```typescript
// main.ts
app.enableCors({
  origin: [
    'https://your-app.vercel.app',
    'https://your-custom-domain.com',
    'http://localhost:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'X-Requested-With']
});
```

### Step 4: Redeploy

After setting the environment variable, redeploy your Vercel application.

## Alternative: Fix Backend Accessibility

If you want to keep using Vercel rewrites, ensure:

1. **Backend is publicly accessible:**
   - Check firewall rules
   - Ensure port 5007 is open
   - Verify the server accepts external connections

2. **Use HTTPS:**
   - Set up SSL certificate (Let's Encrypt is free)
   - Update `vercel.json` to use `https://139.59.2.43:5007`

3. **Use a domain name:**
   - Point a domain to your backend IP
   - Set up SSL
   - Use the domain in `vercel.json` instead of IP

## Testing

After making changes:

1. Check browser console for CORS errors
2. Verify network requests in browser DevTools
3. Test the login endpoint directly
4. Check backend logs for incoming requests

## Current Configuration

Your `api.ts` already supports this:
```typescript
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api'
```

So setting `VITE_API_BASE_URL` will automatically use it!
