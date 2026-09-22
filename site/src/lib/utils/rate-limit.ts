import { RateLimitStore } from "@/types";
import { NextRequest } from "next/server";

const store: RateLimitStore = {};

export function rateLimit(
  request: NextRequest,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: boolean; remaining: number; resetTime: number } {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();

  if (!store[key] || now > store[key].resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      success: true,
      remaining: limit - 1,
      resetTime: store[key].resetTime,
    };
  }

  if (store[key].count >= limit) {
    return { success: false, remaining: 0, resetTime: store[key].resetTime };
  }

  store[key].count++;
  return {
    success: true,
    remaining: limit - store[key].count,
    resetTime: store[key].resetTime,
  };
}
