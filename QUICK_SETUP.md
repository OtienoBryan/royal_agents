# Quick Cloudinary Setup

## Fix the "process is not defined" Error

The error occurs because the admin panel uses Vite (not Create React App), so environment variables need the `VITE_` prefix.

## Quick Fix:

1. **Create a `.env` file** in the `admin` directory with your Cloudinary credentials:

```env
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key
VITE_CLOUDINARY_API_SECRET=your-api-secret
VITE_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

2. **Get your Cloudinary credentials** from [cloudinary.com](https://cloudinary.com):
   - Sign up for a free account
   - Go to Dashboard to get your Cloud Name and API Key
   - Create an upload preset in Settings → Upload

3. **Restart the development server**:
   ```bash
   npm run dev
   ```

## For Development (Without Cloudinary):

The app will work without Cloudinary configuration, but image uploads will show an error message. You can still use the admin panel for other features.

## Full Setup Guide:

See `CLOUDINARY_SETUP.md` for detailed instructions.

