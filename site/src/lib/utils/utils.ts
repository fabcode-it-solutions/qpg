/**
 * Formats file size in bytes to human-readable format
 *
 * @param bytes - Size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Validates if a string is a valid image MIME type
 *
 * @param mimeType - MIME type to validate
 * @returns True if valid image type
 */
export function isValidImageType(mimeType: string): boolean {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  return validTypes.includes(mimeType.toLowerCase());
}

/**
 * Debounces a function call
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Utility function to conditionally join class names
 * Similar to clsx or classnames libraries
 *
 * @param classes - Array of class strings or conditionals
 * @returns Joined class string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

// Helper function to safely convert Stripe timestamp to Date
export function safeStripeDate(
  timestamp: number | null | undefined,
  defaultDaysFromNow: number = 30
): Date {
  if (timestamp && timestamp > 0) {
    const date = new Date(timestamp * 1000);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  // Fallback: if defaultDaysFromNow is 0, use current time, otherwise add days
  return defaultDaysFromNow === 0
    ? new Date()
    : new Date(Date.now() + defaultDaysFromNow * 24 * 60 * 60 * 1000);
}
