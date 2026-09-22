import { Request, Response } from "express";
import { FacebookService } from "../services/facebook.service";
import { logger } from "../utils/logger";

export class FacebookController {
  constructor(private facebookService: FacebookService) {}

  async verifyWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { mode, token, challenge } = req.facebookWebhook || {};

      logger.info(`🔎 Facebook webhook verification request received`, {
        mode,
        hasToken: !!token,
        hasChallenge: !!challenge,
        ip: req.ip,
        query: req.query,
        headers: {
          "user-agent": req.get("User-Agent"),
          "x-forwarded-for": req.get("X-Forwarded-For"),
        },
      });

      if (!mode || !token) {
        logger.warn(
          `❌ Facebook webhook verification failed: Missing parameters`,
          {
            receivedMode: mode,
            receivedToken: token ? "present" : "missing",
            queryParams: req.query,
          }
        );
        res.status(400).json({ error: "Missing webhook parameters" });
        return;
      }

      const result = this.facebookService.verifyWebhook(
        mode,
        token,
        challenge || ""
      );

      if (result) {
        logger.info(`✅ Facebook webhook verified successfully`, {
          challengeLength: result.length,
          mode,
          tokenMatched: true,
        });
        res.status(200).send(result);
      } else {
        logger.warn(`❌ Facebook webhook verification failed: Invalid token`, {
          expectedToken: "QPG_FB_WEBHOOK_12345",
          receivedToken: token,
          mode,
        });
        res.status(403).json({ error: "Webhook verification failed" });
      }
    } catch (error) {
      logger.error("Error verifying Facebook webhook:", error);
      res.status(500).json({ error: "Webhook verification error" });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      logger.info(`🔔 Facebook webhook POST received`, {
        hasBody: !!req.body,
        bodyObject: req.body?.object,
        entryCount: req.body?.entry?.length || 0,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Facebook requires a 200 OK response within 20 seconds
      // So we respond immediately and process the webhook asynchronously
      res.status(200).json({ success: true });

      // Validate webhook payload
      if (!req.body || req.body.object !== "page") {
        logger.warn("Invalid Facebook webhook payload received", {
          body: req.body,
          object: req.body?.object,
        });
        return;
      }

      // Process the webhook asynchronously
      setImmediate(() => {
        this.facebookService.handleWebhook(req.body).catch((error) => {
          logger.error(
            "Error processing Facebook webhook asynchronously:",
            error
          );
        });
      });
    } catch (error) {
      logger.error("Error handling Facebook webhook:", error);
      // If response hasn't been sent yet, send error response
      if (!res.headersSent) {
        res.status(500).json({ error: "Webhook processing error" });
      }
    }
  }

  async getPageInfo(req: Request, res: Response): Promise<void> {
    try {
      const brandStats = this.facebookService.getBrandStats();

      res.json({
        success: true,
        message: "QPG Facebook Brand Ambassador",
        features: [
          "Brand ambassador engagement",
          "Course promotion and marketing",
          "Intelligent comment responses",
          "Community guideline enforcement",
        ],
        brandStats,
        configuration: {
          brandAmbassadorMode: true,
          responseTypes: [
            "general_discussion",
            "course_questions",
            "how_to_handoff",
          ],
          plantClinicUrl:
            process.env.FACEBOOK_PLANT_CLINIC_URL ||
            "https://qpg-site.vercel.app/plant-clinic",
        },
      });
    } catch (error) {
      logger.error("Error getting page info:", error);
      res.status(500).json({ error: "Failed to get page info" });
    }
  }

  async getBrandStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = this.facebookService.getBrandStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Error getting brand stats:", error);
      res.status(500).json({ error: "Failed to get brand stats" });
    }
  }
}
