# Vercel Deployment Guide

This guide will help you deploy the Royal Air Admin application to Vercel.

## Prerequisites

- A Vercel account (sign up at https://vercel.com)
- Your Cloudinary credentials (if using image uploads)
- Your backend API URL (if different from `/api`)

## Deployment Steps

### 1. Install Vercel CLI (Optional)

If you prefer using the CLI:
```bash
npm i -g vercel
```

### 2. Environment Variables

Before deploying, you need to set up environment variables in Vercel:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

```
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
VITE_API_BASE_URL=/api
```

**Note:** `VITE_API_BASE_URL` is optional. If not set, it defaults to `/api`. If your backend is on a different domain, set this to the full URL (e.g., `https://api.yourdomain.com`).

**Note:** These variables are prefixed with `VITE_` because Vite only exposes environment variables that start with this prefix to the client-side code.

### 3. Deploy via Vercel Dashboard

1. Go to https://vercel.com/new
2. Import your Git repository (or drag and drop the `admin` folder)
3. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `admin` (if deploying from monorepo)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Add your environment variables
5. Click "Deploy"

### 4. Deploy via CLI

If using the CLI:

```bash
cd admin
vercel
```

Follow the prompts. For production deployment:
```bash
vercel --prod
```

### 5. Configure API Proxy (if needed)

If your backend API is hosted separately, you may need to:

1. Update the API base URL in `src/services/api.ts` to use your backend URL
2. Or configure Vercel rewrites/proxies in `vercel.json` to forward `/api/*` requests to your backend

Example rewrite configuration (add to `vercel.json`):
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-backend-url.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Post-Deployment

### Verify Deployment

1. Check that the site loads correctly
2. Test authentication/login functionality
3. Verify API connections are working
4. Test image uploads (if using Cloudinary)

### Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility (Vercel uses Node 18.x by default)
- Check build logs in Vercel dashboard

### Environment Variables Not Working

- Ensure variables are prefixed with `VITE_`
- Redeploy after adding new environment variables
- Check that variables are set for the correct environment (Production, Preview, Development)

### API Requests Failing (502/503 Errors)

**Common Issues:**

1. **ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR (502)**
   - **Cause**: Vercel cannot connect to your backend server
   - **Solutions**:
     - Ensure your backend server is publicly accessible (not behind a firewall)
     - Use HTTPS instead of HTTP in `vercel.json` rewrites
     - Verify the backend server is running and accessible
     - Check if your backend IP/domain is correct
     - Ensure the backend accepts connections from Vercel's IP ranges

2. **Backend Server Not Accessible**
   - If using an IP address, ensure it's publicly accessible
   - Consider using a domain name with SSL certificate instead
   - Check firewall rules to allow Vercel's servers
   - Verify the backend port is open and accessible

3. **HTTPS/SSL Issues**
   - Vercel prefers HTTPS endpoints
   - If your backend uses HTTP, you may need to:
     - Set up SSL/TLS for your backend
     - Use a reverse proxy (like Nginx) with SSL
     - Or configure Vercel to allow HTTP (not recommended for production)

4. **CORS Configuration**
   - Ensure your backend allows requests from your Vercel domain
   - Add your Vercel domain to CORS allowed origins
   - Check that preflight OPTIONS requests are handled

5. **Alternative: Direct API Calls**
   - Instead of using Vercel rewrites, you can set `VITE_API_BASE_URL` environment variable
   - Set it to your full backend URL (e.g., `https://api.yourdomain.com`)
   - This bypasses Vercel's proxy and makes direct calls from the browser
   - **Note**: This requires CORS to be properly configured on your backend

### Routing Issues (404 on refresh)

- The `vercel.json` file includes a rewrite rule for SPA routing
- If issues persist, verify the rewrite configuration

## File Structure

The following files are important for Vercel deployment:

- `vercel.json` - Vercel configuration
- `.vercelignore` - Files to exclude from deployment
- `package.json` - Dependencies and build scripts
- `vite.config.ts` - Vite build configuration

## Support

For more information, visit:
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
