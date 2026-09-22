import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { logger } from "../utils/logger";

// Sanitize and validate text input
export const sanitizeInput = (input: string): string => {
  if (typeof input !== "string") return "";

  // Remove potentially dangerous characters
  return input
    .replace(/[\u0000-\u001F\u007F]/g, "") // Remove control characters
    .replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F]/g, " ") // Normalize whitespace
    .trim()
    .slice(0, 2000); // Limit length
};

export const validateChatMessage = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Sanitize message content
  if (req.body.message) {
    req.body.message = sanitizeInput(req.body.message);
  }

  const schema = Joi.object({
    message: Joi.string().required().min(1).max(2000),
    sessionId: Joi.string().uuid().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    logger.warn("Chat message validation failed:", error.details);
    res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
    return;
  }

  next();
};

export const validateSessionId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const schema = Joi.object({
    sessionId: Joi.string().uuid().required(),
  });

  const { error } = schema.validate(req.params);
  if (error) {
    logger.warn("Session ID validation failed:", error.details);
    res.status(400).json({ error: error.details[0].message });
    return;
  }

  next();
};

export const validateFacebookWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Facebook webhook validation
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    req.facebookWebhook = {
      mode: mode as string,
      token: token as string,
      challenge: challenge as string,
    };
  }

  next();
};

// Extend Express Request type for Facebook webhook
declare global {
  namespace Express {
    interface Request {
      facebookWebhook?: {
        mode: string;
        token: string;
        challenge: string;
      };
    }
  }
}
