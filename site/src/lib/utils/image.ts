/**
 * Image utility functions for handling URLs, validation, and display
 * Production-ready utilities for the Q AI Assistant
 */

/**
 * Validates if a URL is a valid image URL
 * @param url - The URL to validate
 * @returns boolean indicating if the URL is valid
 */
export function isValidImageUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  
  // Accept data URLs for base64 images
  if (url.startsWith('data:image/')) return true;
  
  // Accept blob URLs
  if (url.startsWith('blob:')) return true;
  
  try {
    const urlObj = new URL(url);
    
    // Check if it's HTTP, HTTPS, or blob protocol
    if (!['http:', 'https:', 'blob:'].includes(urlObj.protocol)) return false;
    
    // Check for common image extensions
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      urlObj.pathname.toLowerCase().endsWith(ext)
    );
    
    // Accept if it has image extension or if it's from known cloud storage
    const isCloudStorage = urlObj.hostname.includes('amazonaws.com') || 
                          urlObj.hostname.includes('s3') ||
                          urlObj.hostname.includes('cloudinary.com') ||
                          urlObj.hostname.includes('imgur.com') ||
                          urlObj.hostname.includes('localhost');
    
    return hasImageExtension || isCloudStorage || urlObj.protocol === 'blob:';
  } catch {
    return false;
  }
}

/**
 * Gets the best available image URL from attachment data
 * @param attachment - The attachment object
 * @returns The best available URL or null
 */
export function getBestImageUrl(attachment: {
  url?: string;
  imageUrl?: string;
  base64?: string;
  mimeType?: string;
}): string | null {
  // Priority: 1. Backend URL (S3/local), 2. Frontend preview URL, 3. Base64 data
  if (attachment.url && isValidImageUrl(attachment.url)) {
    return attachment.url;
  }
  
  if (attachment.imageUrl && isValidImageUrl(attachment.imageUrl)) {
    return attachment.imageUrl;
  }
  
  if (attachment.base64 && attachment.mimeType?.startsWith('image/')) {
    return `data:${attachment.mimeType};base64,${attachment.base64}`;
  }
  
  return null;
}

/**
 * Creates a fallback image URL if the primary URL fails
 * @param primaryUrl - The primary image URL
 * @param fallbackUrl - The fallback URL
 * @returns Promise that resolves to the working URL
 */
export async function getWorkingImageUrl(
  primaryUrl: string | null, 
  fallbackUrl?: string | null
): Promise<string | null> {
  if (!primaryUrl) return fallbackUrl || null;
  
  try {
    // Test if the primary URL is accessible
    const response = await fetch(primaryUrl, { method: 'HEAD', mode: 'cors' });
    if (response.ok) {
      return primaryUrl;
    }
  } catch (error) {
    console.warn('Primary image URL failed to load:', primaryUrl, error);
  }
  
  // Try fallback
  if (fallbackUrl && isValidImageUrl(fallbackUrl)) {
    try {
      const response = await fetch(fallbackUrl, { method: 'HEAD', mode: 'cors' });
      if (response.ok) {
        return fallbackUrl;
      }
    } catch (error) {
      console.warn('Fallback image URL failed to load:', fallbackUrl, error);
    }
  }
  
  return null;
}

/**
 * Formats file size in a human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Checks if a file type is a valid image MIME type
 * @param mimeType - The MIME type to check
 * @returns boolean indicating if it's a valid image type
 */
export function isValidImageMimeType(mimeType: string): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/svg+xml'
  ];
  
  return validTypes.includes(mimeType.toLowerCase());
}

/**
 * Gets a display name for an attachment
 * @param attachment - The attachment object
 * @returns Display-friendly name
 */
export function getAttachmentDisplayName(attachment: {
  originalName?: string;
  fileName?: string;
  name?: string;
}): string {
  return attachment.originalName || 
         attachment.fileName || 
         attachment.name || 
         'Uploaded file';
}

/**
 * Error handling for image loading failures
 * @param error - The error event
 * @param element - The image element that failed
 * @param fallbackSrc - Optional fallback source
 */
export function handleImageLoadError(
  error: Event, 
  element: HTMLImageElement, 
  fallbackSrc?: string
): void {
  console.error('Image failed to load:', element.src, error);
  
  if (fallbackSrc && element.src !== fallbackSrc) {
    element.src = fallbackSrc;
    return;
  }
  
  // Hide the image if no fallback available
  element.style.display = 'none';
  
  // Add error indicator if parent container exists
  const parent = element.parentElement;
  if (parent && !parent.querySelector('.image-error-indicator')) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'image-error-indicator p-2 bg-red-50 border border-red-200 rounded-lg text-center';
    errorDiv.innerHTML = `
      <p class="text-sm text-red-600">❌ Image failed to load</p>
      <p class="text-xs text-gray-500">${element.alt || 'Unknown image'}</p>
    `;
    parent.appendChild(errorDiv);
  }
}