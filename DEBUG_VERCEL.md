# Debug Vercel API Issues

## Verify Environment Variable is Working

1. **Check the Network Tab** in browser DevTools (F12)
   - Look at the failed login request
   - Check the **Request URL** - it should be:
     - `http://139.59.2.43:5007/api/auth/admin/login` (if env var works)
     - NOT `https://mc-aviation.vercel.app/api/auth/admin/login` (if env var not working)

2. **Check Request Headers**
   - Origin should be: `https://mc-aviation.vercel.app`
   - Content-Type should be: `application/json`

3. **Check Response**
   - Status: 500
   - Response body: `{"statusCode":500,"message":"Internal server error"}`

## Possible Issues

### Issue 1: Environment Variable Not Applied
- Did you redeploy after setting the variable?
- Check Vercel Deployment logs for environment variables
- Variable name must be exactly: `VITE_API_BASE_URL`
- Value must be: `http://139.59.2.43:5007/api` (no trailing slash)

### Issue 2: CORS Not Configured on Backend
The 500 error could be backend rejecting browser requests. Your backend needs:

```javascript
// Add to your backend CORS configuration
cors({
  origin: [
    'https://mc-aviation.vercel.app',
    'http://localhost:3002',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id', 'X-Requested-With']
})
```

### Issue 3: Backend Validation
Your backend might be:
- Checking Origin/Referer headers
- Blocking requests from browsers
- Expecting specific headers not present in browser requests

## Quick Test

Run this in your browser console on https://mc-aviation.vercel.app:

```javascript
fetch('http://139.59.2.43:5007/api/auth/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@royal.com', password: 'admin123' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

If this gives CORS error → Backend CORS not configured
If this gives 500 → Backend rejecting browser requests
If this works → Environment variable not being used by app

## Check Backend Logs

The 500 is coming from your backend. Check server logs to see:
- What error is occurring
- What request is being received
- Why it's failing

## Temporary Workaround: Vercel Serverless Function

If direct calls don't work due to CORS/backend issues, create a proxy:

```javascript
// api/proxy.js in admin folder
export default async function handler(req, res) {
  const response = await fetch(`http://139.59.2.43:5007${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
  })
  
  const data = await response.json()
  res.status(response.status).json(data)
}
```

Then set `VITE_API_BASE_URL=/api/proxy`
