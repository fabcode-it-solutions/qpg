/**
 * Security utility functions for input validation and sanitization
 */

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[<>\"'&]/g, '');
}

/**
 * Sanitize log output to prevent log injection
 */
export function sanitizeLogOutput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[\r\n\t]/g, ' ');
}

/**
 * Validate ID format (alphanumeric, hyphens, underscores only)
 */
export function validateId(id: string): boolean {
  if (typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL and block dangerous protocols
 */
export function validateUrl(url: string): boolean {
  if (typeof url !== 'string') return false;
  
  try {
    const parsedUrl = new URL(url);
    const allowedProtocols = ['http:', 'https:'];
    return allowedProtocols.includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * Check if URL is from trusted video domain
 */
export function isTrustedVideoDomain(url: string): boolean {
  if (!validateUrl(url)) return false;
  
  const trustedDomains = [
    'youtube.com',
    'youtu.be', 
    'vimeo.com',
    'wistia.com'
  ];
  
  try {
    const parsedUrl = new URL(url);
    return trustedDomains.some(domain => 
      parsedUrl.hostname.includes(domain)
    );
  } catch {
    return false;
  }
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(time => now - time < this.windowMs);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}