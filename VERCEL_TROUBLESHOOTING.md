# Vercel 502 Error Troubleshooting Guide

## Understanding the Error

The error `ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR` with status 502 means:
- Vercel's edge servers cannot connect to your backend server
- The backend at `http://139.59.2.43:5007` is not accessible from Vercel's network

## Quick Fixes

### Option 1: Use HTTPS (Recommended)

Update `vercel.json` to use HTTPS:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://139.59.2.43:5007/api/:path*"
    }
  ]
}
```

**Note**: This requires your backend to have SSL/TLS configured.

### Option 2: Use Environment Variable (Direct API Calls)

Instead of using Vercel rewrites, configure direct API calls:

1. **Set Environment Variable in Vercel:**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add: `VITE_API_BASE_URL` = `http://139.59.2.43:5007/api` (or `https://...` if available)

2. **Remove the rewrite from vercel.json:**
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

3. **Configure CORS on your backend** to allow requests from your Vercel domain.

### Option 3: Use a Domain Name

Instead of an IP address, use a domain name:

1. Point a domain to your backend server
2. Set up SSL certificate (Let's Encrypt is free)
3. Update `vercel.json`:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://api.yourdomain.com/api/:path*"
       }
     ]
   }
   ```

## Backend Server Checklist

Ensure your backend server:

- [ ] Is publicly accessible (not behind a firewall blocking Vercel)
- [ ] Is running and responding to requests
- [ ] Has the correct port open (5007)
- [ ] Allows connections from external IPs
- [ ] Has CORS configured to allow your Vercel domain
- [ ] Has SSL/TLS configured (for HTTPS)

## Testing Backend Accessibility

Test if your backend is accessible:

```bash
# From your local machine
curl http://139.59.2.43:5007/api/health

# Or test from a public service
# Use https://www.yougetsignal.com/tools/open-ports/ to check if port 5007 is open
```

## Network Configuration

If your backend is on a private network:

1. **Use a VPN or Tunnel:**
   - Set up ngrok, Cloudflare Tunnel, or similar
   - Point Vercel rewrites to the tunnel URL

2. **Use a Reverse Proxy:**
   - Set up Nginx or similar on a public server
   - Forward requests to your backend
   - Point Vercel to the reverse proxy

## Recommended Solution

For production, the best approach is:

1. **Use a domain name** (not IP address)
2. **Set up SSL/TLS** (HTTPS)
3. **Configure CORS** properly on backend
4. **Use environment variable** `VITE_API_BASE_URL` instead of rewrites for better control

Example backend CORS configuration (if using Express):
```javascript
app.use(cors({
  origin: [
    'https://your-vercel-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

## Still Having Issues?

1. Check Vercel deployment logs for more details
2. Verify backend server logs for incoming requests
3. Test backend API directly using Postman or curl
4. Check if your hosting provider blocks Vercel's IP ranges
5. Consider using Vercel's serverless functions as a proxy
