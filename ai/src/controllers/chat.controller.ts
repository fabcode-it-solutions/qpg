import { Request, Response } from "express";
import { SimplifiedChatService } from "../services/simplified-chat.service";
import { logger } from "../utils/logger";

export class ChatController {
  constructor(private chatService: SimplifiedChatService) {}

  async getUserSession(req: Request, res: Response): Promise<void> {
    try {
      const session = await this.chatService.getUserSession(req.user!.id);
      logger.debug(
        `Retrieved session for user ${req.user!.id}: ${JSON.stringify(session)}`
      );

      res.json({
        success: true,
        data: {
          userId: session?.userId || req.user!.id, // Use session userId if available, otherwise use user id from request

          messageCount: session.messages.length,
          lastActive: session.lastActive,
          createdAt: session.createdAt,
        },
      });
    } catch (error) {
      logger.error("Error getting user session:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get session",
      });
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, stage, week } = req.body;
      const attachments = (req.files as Express.Multer.File[]) || [];

      if (!message || typeof message !== "string") {
        res.status(400).json({
          success: false,
          error: "Message is required",
        });
        return;
      }

      // Process file attachments for base64 conversion if needed
      const processedAttachments = [];

      // Handle both file uploads (multer) and base64 attachments
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          try {
            // Convert file to base64 for processing
            const fs = require("fs");
            const fileBuffer = fs.readFileSync(file.path);
            const base64Data = fileBuffer.toString("base64");

            processedAttachments.push({
              base64: base64Data,
              mimeType: file.mimetype,
              name: file.originalname,
              size: file.size,
            });

            // Clean up temporary file
            fs.unlinkSync(file.path);
          } catch (error) {
            logger.error(
              `Error processing attachment ${file.originalname}:`,
              error
            );
          }
        }
      }

      const result = await this.chatService.sendMessage(
        req.user!.id,
        message,
        req.user!,
        processedAttachments,
        stage,
        week
      );
      logger.debug(
        `Sending message result for user ${req.user!.id}: ${JSON.stringify(
          result
        )}`
      );
      res.json({
        success: true,
        data: {
          userMessage: result.userMessage,
          aiResponse: result.aiResponse,
        },
      });
    } catch (error) {
      logger.error("Error sending message:", error);
      res.status(500).json({
        success: false,
        error: "Failed to send message",
      });
    }
  }

  async getUserHistory(req: Request, res: Response): Promise<void> {
    try {
      const messages = await this.chatService.getUserHistory(req.user!.id);

      res.json({
        success: true,
        data: {
          messages,
          messageCount: messages.length,
        },
      });
    } catch (error) {
      logger.error("Error getting user history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get history",
      });
    }
  }

  async clearUserHistory(req: Request, res: Response): Promise<void> {
    try {
      await this.chatService.clearUserHistory(req.user!.id);

      res.json({
        success: true,
        message: "History cleared successfully",
      });
    } catch (error) {
      logger.error("Error clearing user history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear history",
      });
    }
  }
}
