# Cloudinary Setup for Admin Panel

This guide will help you set up Cloudinary image uploads for the admin panel.

## 1. Create a Cloudinary Account

1. Go to [Cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email address

## 2. Get Your Cloudinary Credentials

1. Log into your Cloudinary dashboard
2. Go to the "Dashboard" section
3. Copy the following values:
   - **Cloud Name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

## 3. Create an Upload Preset

1. In your Cloudinary dashboard, go to "Settings" → "Upload"
2. Scroll down to "Upload presets"
3. Click "Add upload preset"
4. Configure the preset:
   - **Preset name**: `drinks-admin-upload`
   - **Signing Mode**: `Unsigned` (for client-side uploads)
   - **Folder**: `drinks-products`
   - **Access Mode**: `Public`
   - **Auto-tagging**: Enable if desired
5. Click "Save"

## 4. Set Up Environment Variables

Create a `.env` file in the `admin` directory with your Cloudinary credentials:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key
VITE_CLOUDINARY_API_SECRET=your-api-secret
VITE_CLOUDINARY_UPLOAD_PRESET=drinks-admin-upload

# API Configuration
VITE_API_URL=http://localhost:3000
```

**Important**: 
- Replace the placeholder values with your actual Cloudinary credentials
- Use `VITE_` prefix for Vite environment variables (not `REACT_APP_`)
- Restart the development server after adding environment variables

## 5. Features

The Cloudinary integration provides:

- **Drag & Drop Upload**: Users can drag images directly onto the upload area
- **Click to Upload**: Click the upload area to select files
- **Image Preview**: See uploaded images before saving
- **File Validation**: Only image files up to 10MB are accepted
- **Automatic Optimization**: Images are automatically optimized by Cloudinary
- **Secure URLs**: Images are served over HTTPS
- **Folder Organization**: Images are organized in the `drinks-products` folder

## 6. Supported File Types

- PNG
- JPG/JPEG
- GIF
- WebP
- SVG

## 7. File Size Limits

- Maximum file size: 10MB
- Recommended: Under 5MB for better performance

## 8. Security Notes

- The upload preset is configured for unsigned uploads
- Images are stored in a public folder
- Consider implementing server-side validation for production use
- Monitor your Cloudinary usage to stay within free tier limits

## 9. Troubleshooting

### Upload Fails
- Check your Cloudinary credentials
- Verify the upload preset is set to "Unsigned"
- Ensure the folder exists in Cloudinary

### Images Not Displaying
- Check the network tab for CORS errors
- Verify the image URLs are correct
- Ensure your Cloudinary account is active

### File Size Errors
- Reduce image size before uploading
- Use image compression tools
- Consider implementing client-side image resizing

## 10. Production Considerations

For production deployment:

1. **Server-Side Validation**: Implement server-side image validation
2. **Rate Limiting**: Add rate limiting for uploads
3. **Image Processing**: Consider adding image transformations
4. **CDN**: Cloudinary automatically provides CDN delivery
5. **Monitoring**: Set up monitoring for upload success/failure rates

## 11. Cost Management

- Free tier includes 25 GB storage and 25 GB bandwidth
- Monitor usage in the Cloudinary dashboard
- Consider upgrading if you exceed free tier limits
- Implement image optimization to reduce bandwidth usage
