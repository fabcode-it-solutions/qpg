import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { config } from "../config";
import { logger } from "../utils/logger";

// Extend the Express Request type to include rawBody
interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

export function verifyFacebookSignature(
  req: RequestWithRawBody,
  res: Response,
  next: NextFunction
) {
  const signatureHeader = req.headers["x-hub-signature-256"];

  logger.info(`🔐 Verifying Facebook webhook signature`, {
    hasSignature: !!signatureHeader,
    path: req.path,
    method: req.method,
  });

  if (!signatureHeader) {
    logger.warn(
      "❌ Webhook received without x-hub-signature-256 header. Rejecting."
    );
    return res.status(403).json({ error: "Missing signature header" });
  }

  if (
    typeof signatureHeader !== "string" ||
    !signatureHeader.startsWith("sha256=")
  ) {
    logger.warn("❌ Invalid x-hub-signature-256 header format. Rejecting.", {
      signatureHeader,
    });
    return res.status(403).json({ error: "Invalid signature header" });
  }

  // The raw body is needed for the hash comparison. This is set up in your main Express app file.
  if (!req.rawBody) {
    logger.error(
      "❌ Raw body not available for signature verification. Ensure express.json({ verify: ... }) is configured correctly."
    );
    return res
      .status(500)
      .json({ error: "Server configuration error for webhook verification." });
  }

  const signatureHash = signatureHeader.split("=")[1];

  const expectedHash = crypto
    .createHmac("sha256", config.facebook.appSecret)
    .update(req.rawBody)
    .digest("hex");

  if (signatureHash !== expectedHash) {
    logger.warn("❌ Webhook signature validation failed. Rejecting.", {
      expectedHashPrefix: expectedHash.substring(0, 6) + "...",
      receivedHashPrefix: signatureHash.substring(0, 6) + "...",
    });
    return res.status(403).json({ error: "Invalid signature" });
  }
  logger.info("✅ Facebook webhook signature verified successfully.");
  next();
  return;
}
