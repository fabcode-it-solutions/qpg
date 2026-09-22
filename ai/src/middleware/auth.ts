import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

// Simple authentication middleware - replace with proper JWT/OAuth in production
export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // For demo purposes, we'll use a simple API key or create a mock user
    const apiKey = req.headers["x-api-key"] as string;
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      res.status(401).json({ error: "User ID required" });
      return;
    }

    // Mock user data - in production, fetch from database
    req.user = {
      id: userId,
      name: (req.headers["x-user-name"] as string) || "Grower",
      email: (req.headers["x-user-email"] as string) || `${userId}@example.com`,
      membershipLevel: (req.headers["x-membership-level"] as any) || "basic",
      createdAt: new Date(),
      lastActive: new Date(),
    };

    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        membershipLevel: "basic" | "premium" | "pro";
        createdAt: Date;
        lastActive: Date;
      };
    }
  }
}
