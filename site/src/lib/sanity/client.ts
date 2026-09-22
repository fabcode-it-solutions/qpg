import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { sanityConfig } from "./config";

// Sanity client configuration
export const client = createClient({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset || "production",
  useCdn: true, // Use CDN for faster responses
  apiVersion: sanityConfig.apiVersion, // Use current date in YYYY-MM-DD format
});

// Image URL builder
const builder = imageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}

// Helper function to get optimized image URL with bandwidth-conscious defaults
export function getImageUrl(
  source: any,
  width?: number,
  height?: number,
  quality = 65
) {
  if (!source) return null;

  let imageBuilder = urlFor(source).auto("format").quality(quality); // Reduced from 80 to 65 for better compression

  if (width) {
    imageBuilder = imageBuilder.width(width);
  }

  if (height) {
    imageBuilder = imageBuilder.height(height);
  }

  return imageBuilder.url();
}

// Responsive image helper with predefined optimized sizes
export function getResponsiveImageUrls(source: any, quality = 60) {
  if (!source) return null;

  return {
    thumbnail: getImageUrl(source, 300, 200, quality),
    small: getImageUrl(source, 640, 480, quality),
    medium: getImageUrl(source, 1024, 768, quality),
    large: getImageUrl(source, 1600, 1200, quality),
    hero: getImageUrl(source, 1920, 1080, quality),
  };
}

// Optimized thumbnail for lists/cards
export function getThumbnailUrl(
  source: any,
  size: "xs" | "sm" | "md" | "lg" = "md"
) {
  const sizes = {
    xs: [150, 100],
    sm: [300, 200],
    md: [400, 267],
    lg: [600, 400],
  } as const;

  const [width, height] = sizes[size];
  return getImageUrl(source, width, height, 55); // Lower quality for thumbnails
}
