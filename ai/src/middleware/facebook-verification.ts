import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { config } from "../config";
import { logger } from "../utils/logger";

/**
 * Middleware to verify that webhook requests are coming from Facebook
 * by validating the signature using the app secret
 */
export function verifyFacebookSignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Skip verification for GET requests (used for initial webhook verification)
  if (req.method === "GET") {
    return next();
  }

  const signature = req.headers["x-hub-signature-256"] as string;

  if (!signature) {
    logger.warn("Facebook webhook request missing signature");
    return res.status(401).json({ error: "Missing signature" });
  }

  try {
    // Get raw body
    const rawBody = JSON.stringify(req.body);

    // Calculate expected signature
    const expectedSignature =
      "sha256=" +
      crypto
        .createHmac("sha256", config.facebook.appSecret)
        .update(rawBody)
        .digest("hex");

    // Compare signatures using constant-time comparison to prevent timing attacks
    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!valid) {
      logger.warn("Invalid Facebook webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    logger.debug("Facebook webhook signature verified");
    next();
  } catch (error) {
    logger.error("Error verifying Facebook webhook signature:", error);
    res.status(500).json({ error: "Signature verification error" });
  }
}
