import { Router } from "express";
import { config } from "../config";
import axios from "axios";
import { logger } from "../utils/logger";

export function createFacebookAuthRoutes(): Router {
  const router = Router();

  // Route to display instructions for manual token generation
  router.get("/token-instructions", (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Facebook Token Instructions</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
            .step { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Facebook Access Token Instructions</h1>
          
          <div class="step">
            <h3>Step 1: Generate a Short-lived Token</h3>
            <p>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank">Graph API Explorer</a></p>
            <ul>
              <li>Select your app from the dropdown</li>
              <li>Click "Generate Access Token"</li>
              <li>Select your page</li>
              <li>Select these permissions: pages_manage_posts, pages_read_engagement, pages_show_list, pages_messaging</li>
              <li>Copy the generated token</li>
            </ul>
          </div>
          
          <div class="step">
            <h3>Step 2: Convert to a Long-lived Token</h3>
            <p>Use this endpoint to convert your short-lived token:</p>
            <pre>/api/facebook-auth/exchange-token?token=YOUR_SHORT_LIVED_TOKEN</pre>
          </div>
          
          <div class="step">
            <h3>Step 3: Update Your .env File</h3>
            <p>Add the long-lived token to your .env file as FACEBOOK_PAGE_ACCESS_TOKEN</p>
          </div>
        </body>
      </html>
    `);
  });

  // Route to exchange short-lived token for long-lived token
  router.get("/exchange-token", async (req, res) => {
    try {
      const shortLivedToken = req.query.token as string;

      if (!shortLivedToken) {
        return res.status(400).json({
          error: "Missing token parameter",
          usage:
            "/api/facebook-auth/exchange-token?token=YOUR_SHORT_LIVED_TOKEN",
        });
      }

      // Exchange for long-lived token
      const response = await axios.get(
        `${
          config.facebook.graphUrl || "https://graph.facebook.com/v23.0"
        }/oauth/access_token`,
        {
          params: {
            grant_type: "fb_exchange_token",
            client_id: config.facebook.appId,
            client_secret: config.facebook.appSecret,
            fb_exchange_token: shortLivedToken,
          },
        }
      );

      if (response.data && response.data.access_token) {
        // Get token details
        const tokenInfo = await axios.get(
          `${
            config.facebook.graphUrl || "https://graph.facebook.com/v23.0"
          }/debug_token`,
          {
            params: {
              input_token: response.data.access_token,
              access_token: `${config.facebook.appId}|${config.facebook.appSecret}`,
            },
          }
        );

        return res.json({
          success: true,
          message: "Token exchanged successfully",
          token: response.data.access_token,
          expiresIn: response.data.expires_in || "unknown",
          tokenData: tokenInfo.data.data,
        });
      } else {
        return res.status(400).json({ error: "Failed to exchange token" });
      }
    } catch (error) {
      logger.error("Error exchanging Facebook token:", error);
      return res.status(500).json({
        error: "Failed to exchange token",
        details: (error as any).response?.data || (error as Error).message,
      });
    }
  });

  // Route to get page details using a token
  router.get("/page-details", async (req, res) => {
    try {
      const accessToken = req.query.token as string;

      if (!accessToken) {
        return res.status(400).json({
          error: "Missing token parameter",
          usage: "/api/facebook-auth/page-details?token=YOUR_ACCESS_TOKEN",
        });
      }

      // Get user pages
      const response = await axios.get(
        `${
          config.facebook.graphUrl || "https://graph.facebook.com/v23.0"
        }/me/accounts`,
        {
          params: { access_token: accessToken },
        }
      );

      if (response.data && response.data.data) {
        res.json({
          success: true,
          pages: response.data.data.map(
            (page: {
              id: any;
              name: any;
              access_token: any;
              category: any;
            }) => ({
              id: page.id,
              name: page.name,
              accessToken: page.access_token,
              category: page.category,
            })
          ),
        });
      } else {
        res.status(400).json({ error: "Failed to get page details" });
      }
      return;
    } catch (error) {
      logger.error("Error getting Facebook page details:", error);
      res.status(500).json({
        error: "Failed to get page details",
        details: (error as any).response?.data || (error as Error).message,
      });
      return;
    }
  });

  return router;
}
