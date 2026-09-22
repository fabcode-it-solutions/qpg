import winston from "winston";
import { config } from "../config";
import path from "path";
import fs from "fs";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (error) {
    console.error("Failed to create logs directory:", error);
  }
}

// Custom format for better readability
const customFormat = winston.format.printf(
  ({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0 && metadata.service) {
      const meta = { ...metadata };
      delete meta.service; // Remove service from metadata display
      if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
      }
    }

    // Add stack trace for errors
    if (stack) {
      msg += `\n${stack}`;
    }

    return msg;
  }
);

const logger = winston.createLogger({
  level: config.server.nodeEnv === "production" ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "q-ai-server" },
  transports: [],
});

// Add Console transport for ALL environments (critical for production visibility)
logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      customFormat
    ),
    handleExceptions: true,
    handleRejections: true,
  })
);

// Add File transports only if we can write to filesystem
// (Some cloud platforms don't allow file writing)
try {
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      handleExceptions: true,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      handleExceptions: true,
      handleRejections: true,
    })
  );

  logger.info("File logging initialized successfully");
} catch (error) {
  logger.warn("File logging disabled - filesystem not writable", { error });
}

// Log unhandled rejections and exceptions
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logger.error("Unhandled Rejection at:", {
    promise,
    reason: reason?.stack || reason,
  });
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", {
    error: error.message,
    stack: error.stack,
  });
  // Give logger time to write before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Helper to test logging on startup
logger.info("Logger initialized", {
  environment: config.server.nodeEnv,
  logLevel: logger.level,
  transports: logger.transports.map((t) => t.constructor.name),
});

export { logger };
