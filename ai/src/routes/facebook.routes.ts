import { Router, Request, Response, NextFunction } from "express";
import { FacebookController } from "../controllers/facebook.controller";
import { validateFacebookWebhook } from "../middleware/validation";
import { verifyFacebookSignature } from "../middleware/facebook-signature";
import { logger } from "../utils/logger";
import { config } from "../config";

export function createFacebookRoutes(
  facebookController: FacebookController
): Router {
  const router = Router();

  // Facebook webhook verification (GET)
  router.get(
    "/webhook",
    validateFacebookWebhook,
    facebookController.verifyWebhook.bind(facebookController)
  );

  // Facebook webhook events (POST)
  router.post(
    "/webhook",
    logWebhookPayload,
    verifyFacebookSignature, // Add signature verification
    facebookController.handleWebhook.bind(facebookController)
  );

  // Page info endpoint
  router.get(
    "/page-info",
    facebookController.getPageInfo.bind(facebookController)
  );

  // Brand ambassador stats endpoint
  router.get(
    "/brand-stats",
    facebookController.getBrandStats.bind(facebookController)
  );

  // Test webhook verification endpoint
  router.get("/webhook-test", (req, res) => {
    res.json({
      success: true,
      message: "Facebook webhook testing endpoints",
      configuration: {
        webhookUrl: `${req.protocol}://${req.get("host")}/api/facebook/webhook`,
        verifyToken: config.facebook.verifyToken,
        pageId: config.facebook.pageId,
        appId: config.facebook.appId,
      },
      testEndpoints: {
        verification: `${req.protocol}://${req.get(
          "host"
        )}/api/facebook/webhook?hub.mode=subscribe&hub.verify_token=${
          config.facebook.verifyToken
        }&hub.challenge=test123`,
        simulatePost: `${req.protocol}://${req.get(
          "host"
        )}/api/facebook/simulate-webhook`,
        pageInfo: `${req.protocol}://${req.get("host")}/api/facebook/page-info`,
        brandStats: `${req.protocol}://${req.get(
          "host"
        )}/api/facebook/brand-stats`,
      },
      instructions: {
        step1: "Test verification using the verification URL above",
        step2: "Use simulate-webhook endpoint to test POST handling",
        step3: "Check server logs for brand ambassador responses",
        step4: "Configure Facebook App webhook with the webhookUrl above",
        step5: "Monitor brand stats for engagement metrics",
      },
    });
  });

  // Simulate webhook for testing
  router.post("/simulate-webhook", (req, res) => {
    const testPayload = {
      object: "page",
      entry: [
        {
          id: config.facebook.pageId,
          time: Date.now(),
          changes: [
            {
              field: "feed",
              value: {
                item: "comment",
                comment_id: "test_comment_123",
                post_id: "test_post_123",
                message:
                  "How do I start growing cannabis? What nutrients should I use?",
                from: {
                  id: "test_user_123",
                  name: "Test User",
                },
                created_time: Math.floor(Date.now() / 1000),
              },
            },
          ],
        },
      ],
    };

    logger.info(
      "Simulating Facebook comment webhook for brand ambassador testing"
    );

    // Process the simulated webhook
    facebookController.handleWebhook({ body: testPayload } as any, res as any);
  });

  return router;
}

// Middleware to log webhook payloads
function logWebhookPayload(req: Request, res: Response, next: NextFunction) {
  logger.info("🔔 Facebook webhook triggered", {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    path: req.path,
  });

  // Log the webhook type
  if (req.body && req.body.object === "page") {
    for (const entry of req.body.entry || []) {
      if (entry.changes) {
        for (const change of entry.changes) {
          logger.info(
            `📝 Facebook webhook: ${change.field} - ${
              change.value?.item || "unknown"
            }`,
            {
              field: change.field,
              item: change.value?.item,
              from: change.value?.from?.name || "unknown",
              fromId: change.value?.from?.id || "unknown",
            }
          );
        }
      }
    }
  }

  next();
}
