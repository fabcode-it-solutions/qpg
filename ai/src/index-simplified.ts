import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cron from "node-cron";
import path from "path";

import { config } from "./config";
import { logger } from "./utils/logger";

// Services
import { DatabaseService } from "./services/database.service";
import { SimplifiedChatService } from "./services/simplified-chat.service";
import { SimplifiedWebSocketService } from "./services/simplified-websocket.service";
import { FacebookService } from "./services/facebook.service";

// Controllers
import { SimplifiedChatController } from "./controllers/simplified-chat.controller";
import { FacebookController } from "./controllers/facebook.controller";

// Routes
import { Router } from "express";
import { uploadMiddleware } from "./middleware/upload";
import { createFacebookRoutes } from "./routes/facebook.routes";
import { createFacebookAuthRoutes } from "./routes/facebook-auth.routes";

// Data
import { initializeProtocols } from "./data/protocols";

class SimplifiedQAIServer {
  private app: express.Application;
  private httpServer: any;
  private databaseService: DatabaseService;
  private facebookService: FacebookService;
  private chatService: SimplifiedChatService;
  private webSocketService: SimplifiedWebSocketService;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.databaseService = new DatabaseService();
    this.facebookService = new FacebookService(this.databaseService);
    this.chatService = new SimplifiedChatService(this.databaseService);
    this.webSocketService = new SimplifiedWebSocketService(
      this.httpServer,
      this.chatService
    );
  }

  async initialize(): Promise<void> {
    try {
      // Initialize services
      await this.databaseService.initialize();
      logger.info("Database service initialized");

      // Initialize protocols
      await initializeProtocols(this.databaseService);
      logger.info("QPG protocols loaded");

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      // Setup scheduled tasks
      this.setupScheduledTasks();

      logger.info("✅ Simplified Q AI Server initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize server:", error);
      throw error;
    }
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(
      cors({
        origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
        credentials: true,
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: { error: "Too many requests, please try again later" },
    });
    this.app.use("/api/", limiter);

    // Capture raw body for Facebook webhook verification
    const rawBodySaver = (
      req: any,
      res: any,
      buf: Buffer,
      encoding: string
    ) => {
      if (buf && buf.length) {
        req.rawBody = buf;
      }
    };

    // Body parsing with raw body capture for Facebook routes
    this.app.use(
      "/api/facebook/webhook",
      express.json({
        limit: "10mb",
        verify: rawBodySaver,
      })
    );

    // Regular body parsing for other routes
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Static files for uploads
    this.app.use(
      "/uploads",
      express.static(path.join(process.cwd(), "uploads"))
    );

    // Request logging
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check with simplified system info
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "2.0.0-simplified",
        workflow: "simplified_diagnostic",
        services: {
          database: "connected",
          gemini: "connected",
          facebook: "configured",
          websocket: "active",
          diagnostic_service: "active",
          chat_service: "simplified",
        },
      });
    });

    // Create simplified chat routes
    const simplifiedChatController = new SimplifiedChatController(this.chatService);
    const chatRouter = Router();
    
    // Chat endpoints
    chatRouter.post("/messages", uploadMiddleware, (req, res) => 
      simplifiedChatController.sendMessage(req, res)
    );
    chatRouter.get("/sessions/:sessionId?", (req, res) => 
      simplifiedChatController.getSession(req, res)
    );
    chatRouter.get("/health", (req, res) => 
      simplifiedChatController.healthCheck(req, res)
    );
    chatRouter.delete("/history", (req, res) => 
      simplifiedChatController.clearHistory(req, res)
    );

    // API routes
    const facebookController = new FacebookController(this.facebookService);
    this.app.use("/api/chat", chatRouter);
    this.app.use("/api/facebook", createFacebookRoutes(facebookController));
    this.app.use("/api/facebook-auth", createFacebookAuthRoutes());

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.json({
        message: "Q AI Assistant Server - Simplified Diagnostic System",
        version: "2.0.0-simplified",
        workflow: "simplified_diagnostic",
        features: {
          diagnostic_workflow: "3-step process following exact requirements",
          api_pattern: "2-call system for simple queries",
          protocols: "QPG method integrated",
          realtime: "WebSocket support",
          image_analysis: "Gemini 2.5 integration",
        },
        endpoints: {
          health: "/health",
          chat: "/api/chat",
          facebook: "/api/facebook",
          facebookAuth: "/api/facebook-auth",
        },
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({ error: "Endpoint not found" });
    });

    // Global error handler
    this.app.use(
      (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        logger.error("Unhandled error:", error);

        if (res.headersSent) {
          return next(error);
        }

        res.status(500).json({
          error:
            config.server.nodeEnv === "production"
              ? "Internal server error"
              : error.message,
          workflow: "simplified_diagnostic",
        });
      }
    );

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      process.exit(0);
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully");
      process.exit(0);
    });
  }

  private setupScheduledTasks(): void {
    // Clean up inactive sessions every hour
    cron.schedule("0 * * * *", () => {
      logger.debug("Running scheduled cleanup of inactive sessions");
      this.chatService.cleanupInactiveSessions();
    });

    // Clean up old database sessions daily at 2 AM
    cron.schedule("0 2 * * *", async () => {
      logger.debug("Running scheduled cleanup of old database sessions");
      await this.databaseService.cleanupOldSessions();
    });

    // System monitoring and cleanup every 6 hours
    cron.schedule("0 */6 * * *", () => {
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      };

      logger.info("System status check", {
        uptime: process.uptime(),
        memory: memUsageMB,
        workflow: "simplified_diagnostic",
        timestamp: new Date().toISOString(),
      });

      // Force garbage collection if heap usage is high
      if (memUsageMB.heapUsed > 200 && global.gc) {
        global.gc();
        logger.debug("Forced garbage collection due to high memory usage");
      }
    });

    // Memory pressure monitoring every 30 minutes in production
    if (config.server.nodeEnv === "production") {
      cron.schedule("*/30 * * * *", () => {
        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);

        if (heapUsedMB > 400) {
          logger.warn("High memory usage detected", {
            heapUsedMB,
            rssUsedMB: Math.round(memUsage.rss / 1024 / 1024),
            workflow: "simplified_diagnostic",
            timestamp: new Date().toISOString(),
          });
        }
      });
    }
  }

  async start(): Promise<void> {
    const port = config.server.port;

    this.httpServer.listen(port, () => {
      logger.info(`🚀 Simplified Q AI Server running on port ${port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
      logger.info(`Workflow: simplified_diagnostic`);
      logger.info(`Version: 2.0.0-simplified`);
      logger.info("✅ HTTP and WebSocket servers ready");
    });
  }
}

// Start the server
async function main() {
  try {
    logger.info("🚀 Starting Simplified Q AI Server...");
    const server = new SimplifiedQAIServer();
    await server.initialize();
    await server.start();
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

main();