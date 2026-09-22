import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { TokenValidationResult } from "@/types";

/**
 * Validates Bunny.net token authentication
 */
export function validateBunnyToken(
  token: string,
  expires: string,
  videoId: string,
  tokenSecurityKey: string,
  userId?: string
): TokenValidationResult {
  try {
    // Check if token has expired
    const expirationTime = parseInt(expires);
    const currentTime = Math.floor(Date.now() / 1000);

    if (currentTime > expirationTime) {
      return {
        isValid: false,
        error: "Token has expired",
      };
    }

    // Recreate the auth string
    let authString = tokenSecurityKey + videoId + expirationTime;

    if (userId) {
      authString += userId;
    }

    // Generate expected token
    const hash = crypto.createHash("sha256");
    hash.update(authString);
    const expectedToken = hash.digest("hex");

    // Compare tokens
    if (token !== expectedToken) {
      return {
        isValid: false,
        error: "Invalid token",
      };
    }

    return {
      isValid: true,
      videoId,
      userId,
      expiresAt: expirationTime,
    };
  } catch (error) {
    return {
      isValid: false,
      error: "Token validation failed",
    };
  }
}

/**
 * Middleware to protect video streaming endpoints
 */
export async function bunnyStreamMiddleware(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const expires = url.searchParams.get("expires");
  const userId = url.searchParams.get("user");

  if (!token || !expires) {
    return NextResponse.json(
      { error: "Missing authentication parameters" },
      { status: 401 }
    );
  }

  // Extract video ID from path
  const pathParts = url.pathname.split("/");
  const videoId = pathParts[pathParts.length - 2]; // Assuming pattern /videos/{videoId}/stream

  // Get token security key from environment or database
  const tokenSecurityKey = process.env.BUNNY_TOKEN_AUTH_KEY!;

  const validation = validateBunnyToken(
    token,
    expires,
    videoId,
    tokenSecurityKey,
    userId || undefined
  );

  if (!validation.isValid) {
    return NextResponse.json({ error: validation.error }, { status: 403 });
  }

  // Add validated info to request headers for downstream use
  const headers = new Headers(request.headers);
  headers.set("X-Video-Id", videoId);
  if (userId) {
    headers.set("X-User-Id", userId);
  }
  headers.set("X-Token-Expires", expires);

  return NextResponse.next({
    request: {
      headers,
    },
  });
}

/**
 * Rate limiting for video access
 */
export class VideoAccessRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 10, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(identifier) || [];

    // Remove old attempts outside the window
    const validAttempts = attempts.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, attempts] of this.attempts.entries()) {
      const validAttempts = attempts.filter(
        (timestamp) => now - timestamp < this.windowMs
      );
      if (validAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, validAttempts);
      }
    }
  }
}

// Singleton rate limiter instance
export const videoRateLimiter = new VideoAccessRateLimiter();
