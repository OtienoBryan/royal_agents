// Cloudinary service for image uploads
import { Cloudinary } from 'cloudinary-core'

// Cloudinary configuration
const cloudinaryConfig = {
  cloud_name: (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: (import.meta as any).env?.VITE_CLOUDINARY_API_KEY || 'demo',
  api_secret: (import.meta as any).env?.VITE_CLOUDINARY_API_SECRET || 'demo',
  upload_preset: (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'demo'
}

// Initialize Cloudinary
const cloudinary = new Cloudinary(cloudinaryConfig)

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  bytes: number
}

export interface CloudinaryUploadOptions {
  folder?: string
  transformation?: any
  tags?: string[]
}

class CloudinaryService {
  private cloudName: string
  private uploadPreset: string
  private isConfigured: boolean

  constructor() {
    this.cloudName = cloudinaryConfig.cloud_name
    this.uploadPreset = cloudinaryConfig.upload_preset
    this.isConfigured = this.cloudName !== 'demo' && this.uploadPreset !== 'demo'
    
    if (!this.isConfigured) {
      console.warn('Cloudinary not configured. Please set up your environment variables.')
    }
  }

  /**
   * Upload image to Cloudinary
   */
  async uploadImage(
    file: File, 
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary is not configured. Please set up your environment variables.')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', this.uploadPreset)
    
    if (options.folder) {
      formData.append('folder', options.folder)
    }
    
    if (options.tags) {
      formData.append('tags', options.tags.join(','))
    }

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      )

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw new Error('Failed to upload image to Cloudinary')
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: File[], 
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, options))
    return Promise.all(uploadPromises)
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_id: publicId,
            signature: this.generateSignature()
          })
        }
      )

      return response.ok
    } catch (error) {
      console.error('Cloudinary delete error:', error)
      return false
    }
  }

  /**
   * Generate Cloudinary URL for image with transformations
   */
  getImageUrl(publicId: string, transformations: any = {}): string {
    return cloudinary.url(publicId, transformations)
  }

  /**
   * Generate signature for authenticated requests
   */
  private generateSignature(): string {
    // In production, this should be done on the server side
    // For now, we'll use unsigned uploads with upload presets
    return ''
  }

  /**
   * Get optimized image URL with common transformations
   */
  getOptimizedImageUrl(publicId: string, width?: number, height?: number, quality: string = 'auto'): string {
    const transformations: any = {
      quality,
      fetch_format: 'auto'
    }

    if (width) transformations.width = width
    if (height) transformations.height = height

    return this.getImageUrl(publicId, transformations)
  }
}

export const cloudinaryService = new CloudinaryService()
export default cloudinaryService
