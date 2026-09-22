import { Request, Response } from "express";
import { SimplifiedChatService } from "../services/simplified-chat.service";
import { logger } from "../utils/logger";
import { User } from "../types";

export class SimplifiedChatController {
  private chatService: SimplifiedChatService;

  constructor(chatService: SimplifiedChatService) {
    this.chatService = chatService;
  }

  /**
   * Send a message to the AI
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, stage, week } = req.body;
      const files = req.files as Express.Multer.File[];

      // Extract user information from headers
      const userId = req.headers["x-user-id"] as string;
      const userName = req.headers["x-user-name"] as string;
      const userEmail = req.headers["x-user-email"] as string;
      const membershipLevel = (req.headers["x-membership-level"] as string) || "basic";

      if (!userId || !userName) {
        res.status(400).json({
          error: "Missing required headers: x-user-id and x-user-name",
        });
        return;
      }

      if (!message || message.trim() === "") {
        res.status(400).json({
          error: "Message content is required",
        });
        return;
      }

      // Create user object
      const user: User = {
        id: userId,
        name: userName,
        email: userEmail || `${userId}@example.com`,
        membershipLevel: membershipLevel as any,
        createdAt: new Date(),
        lastActive: new Date(),
      };

      logger.info(`📨 Received message request from user ${userId}: "${message.substring(0, 50)}..."`);

      // Process attachments
      const attachments = files?.map((file) => ({
        mimeType: file.mimetype,
        base64: file.buffer.toString("base64"),
        name: file.originalname,
        size: file.size,
      })) || [];

      // Process the message using simplified chat service
      const result = await this.chatService.sendMessage(
        userId,
        message,
        user,
        attachments,
        stage,
        week
      );

      logger.info(`✅ Message processed successfully for user ${userId}`);

      // Return the result
      res.json({
        success: true,
        data: {
          userMessage: {
            id: result.userMessage.id,
            content: result.userMessage.content,
            role: result.userMessage.role,
            timestamp: result.userMessage.timestamp,
            attachments: result.userMessage.attachments,
          },
          aiResponse: {
            id: result.aiResponse.id,
            content: result.aiResponse.content,
            role: result.aiResponse.role,
            timestamp: result.aiResponse.timestamp,
            metadata: result.aiResponse.metadata,
          },
        },
        metadata: {
          workflow: result.aiResponse.metadata?.workflow || "simplified",
          category: result.aiResponse.metadata?.category || "general",
          processedAt: result.aiResponse.metadata?.processedAt || new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error("Error in sendMessage:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to process message. Please try again.",
      });
    }
  }

  /**
   * Get user session history
   */
  async getSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers["x-user-id"] as string;

      if (!userId) {
        res.status(400).json({
          error: "Missing required header: x-user-id",
        });
        return;
      }

      const session = await this.chatService.getUserSession(userId);
      
      res.json({
        success: true,
        data: {
          userId: session?.userId || userId,
          messages: session?.messages || [],
          lastActive: session?.lastActive,
          createdAt: session?.createdAt,
          messageCount: session?.messages?.length || 0,
        },
      });
    } catch (error) {
      logger.error("Error in getSession:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to retrieve session. Please try again.",
      });
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        message: "Simplified Chat Controller is healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        workflow: "simplified_diagnostic",
      });
    } catch (error) {
      logger.error("Error in healthCheck:", error);
      res.status(500).json({
        error: "Health check failed",
      });
    }
  }

  /**
   * Clear user chat history
   */
  async clearHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers["x-user-id"] as string;

      if (!userId) {
        res.status(400).json({
          error: "Missing required header: x-user-id",
        });
        return;
      }

      await this.chatService.clearUserHistory(userId);
      logger.info(`Chat history cleared for user ${userId}`);
      res.json({ success: true, message: "Chat history cleared" });
    } catch (error) {
      logger.error("Error in clearHistory:", error);
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to clear chat history. Please try again.",
      });
    }
  }
}