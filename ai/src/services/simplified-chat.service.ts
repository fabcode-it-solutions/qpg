import { v4 as uuidv4 } from "uuid";
import { DatabaseService } from "./database.service";
import { GeminiService } from "./gemini.service";
import { DiagnosticService } from "./diagnostic.service";
import {
  IFileStorageService,
  LocalFileStorageService,
  S3FileStorageService,
} from "./file-storage.service";
import { config } from "../config";
import { logger } from "../utils/logger";
import { ChatMessage, User, FileAttachment } from "../types";

export class SimplifiedChatService {
  private databaseService: DatabaseService;
  private geminiService: GeminiService;
  private fileStorageService: IFileStorageService;
  private diagnosticService: DiagnosticService;

  constructor(databaseService: DatabaseService) {
    try {
      this.databaseService = databaseService;
      this.geminiService = new GeminiService();
      this.diagnosticService = new DiagnosticService(databaseService);

      // Select storage provider
      if (config.storage.provider === "s3") {
        this.fileStorageService = new S3FileStorageService();
      } else {
        this.fileStorageService = new LocalFileStorageService();
      }
    } catch (error) {
      logger.error("Failed to initialize SimplifiedChatService:", error);
      throw error;
    }
  }

  async getUserSession(userId: string): Promise<any> {
    return await this.diagnosticService.getUserSession(userId);
  }

  async sendMessage(
    userId: string,
    content: string,
    user: User,
    attachments?: any[],
    stage?: string,
    week?: number,
    day?: number
  ): Promise<{ userMessage: ChatMessage; aiResponse: ChatMessage }> {
    logger.info(
      `📨 Processing message from user: ${
        userId?.substring(0, 8) || "unknown"
      }: ${content?.substring(0, 30) || "empty"}...`
    );

    const processedAttachments: FileAttachment[] = [];
    let imageAnalysis: string | undefined;

    try {
      // Handle image attachments
      if (attachments && attachments.length > 0) {
        const imageAttachment = attachments.find(
          (att) =>
            att &&
            att.mimeType &&
            config.upload.allowedMimeTypes.includes(att.mimeType)
        );

        if (imageAttachment && imageAttachment.base64) {
          const buffer = Buffer.from(imageAttachment.base64, "base64");

          if (buffer.length > config.upload.maxFileSize) {
            imageAnalysis = `The uploaded image is too large. The maximum allowed size is ${
              config.upload.maxFileSize / 1024 / 1024
            }MB.`;
            processedAttachments.push({
              mimeType: imageAttachment.mimeType,
              error: "File too large",
              originalName: imageAttachment.name || "upload",
              size: buffer.length,
            } as FileAttachment);
          } else {
            logger.info(
              `🔍 Analyzing image for user: ${
                userId?.substring(0, 8) || "unknown"
              }...`
            );
            imageAnalysis = await this.geminiService.analyzeImage(
              imageAttachment.base64,
              imageAttachment.mimeType,
              content ||
                "Please analyze this image of my plant and identify any potential issues."
            );

            // Upload image and store URL
            const imageUrl = await this.fileStorageService.upload(
              imageAttachment.base64,
              imageAttachment.mimeType,
              userId,
              imageAttachment.name || `user-${userId}-upload`
            );

            processedAttachments.push({
              mimeType: imageAttachment.mimeType,
              url: imageUrl,
              originalName: imageAttachment.name || "upload",
              size: buffer.length,
            });
          }
        }
      }

      // Create user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        userId,
        content,
        role: "user",
        timestamp: new Date(),
        attachments: processedAttachments,
      };

      // Get current session messages for context first
      const session = await this.getUserSession(userId);
      const chatHistory = session?.messages || [];

      // Determine if this is a diagnostic case or simple query
      const isDiagnosticCase = await this.isDiagnosticCase(
        content,
        imageAnalysis,
        userId
      );

      let aiResult;

      if (isDiagnosticCase) {
        logger.info(
          `🔍 Processing diagnostic case for user: ${
            userId?.substring(0, 8) || "unknown"
          }`
        );
        aiResult = await this.diagnosticService.processDiagnosticQuery(
          userId,
          content,
          user,
          imageAnalysis,
          stage,
          week,
          day
        );
      } else {
        logger.info(
          `🤖 Processing simple query for user: ${
            userId?.substring(0, 8) || "unknown"
          }`
        );
        aiResult = await this.diagnosticService.processSimpleQuery(
          userId,
          content,
          user,
          chatHistory,
          imageAnalysis
        );
      }

      // Create AI response message
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        userId,
        content: aiResult.response,
        role: "assistant",
        timestamp: new Date(),
        metadata: aiResult.metadata,
      };

      // Store messages in database
      logger.info(`📋 Storing messages with stage: ${stage}, week: ${week}, day: ${day}`);
      await this.diagnosticService.storeMessages(
        userId,
        userMessage,
        aiMessage,
        stage,
        week,
        day
      );

      logger.info(
        `✅ Message processing completed for user: ${
          userId?.substring(0, 8) || "unknown"
        }`
      );

      return {
        userMessage,
        aiResponse: aiMessage,
      };
    } catch (error) {
      logger.error("Error processing message:", error);

      const userMessage: ChatMessage = {
        id: uuidv4(),
        userId,
        content,
        role: "user",
        timestamp: new Date(),
        attachments: processedAttachments,
      };

      const errorMessage: ChatMessage = {
        id: uuidv4(),
        userId,
        content:
          "I'm having some technical difficulties right now. Please try again in a moment, and I'll do my best to help you with your cannabis growing question.",
        role: "assistant",
        timestamp: new Date(),
        metadata: {
          error: "processing_failed",
          processedAt: new Date().toISOString(),
        },
      };

      try {
        await this.diagnosticService.storeMessages(
          userId,
          userMessage,
          errorMessage
        );
      } catch (storeError) {
        logger.error("Failed to store error messages:", storeError);
      }

      return {
        userMessage,
        aiResponse: errorMessage,
      };
    }
  }

  /**
   * Determine if query needs diagnostic workflow or simple 2-API-call pattern
   */
  private async isDiagnosticCase(
    query: string,
    imageAnalysis?: string,
    userId?: string
  ): Promise<boolean> {
    // First check if we're already in diagnostic mode
    if (userId) {
      const session = await this.getUserSession(userId);
      const messages = session?.messages || [];

      logger.info(
        `🔍 Session check - found ${messages.length} messages for user: ${
          userId?.substring(0, 8) || "unknown"
        }`
      );

      if (messages.length > 0) {
        const lastAiMessage = messages
          .filter((m: any) => m.role === "assistant")
          .pop();

        logger.info(
          `🔍 Last AI message metadata: ${JSON.stringify(
            lastAiMessage?.metadata || {}
          )}`
        );

        // If last AI message was diagnostic questions, continue in diagnostic mode
        if (
          lastAiMessage?.metadata?.category === "diagnostic_questions" ||
          lastAiMessage?.metadata?.step === "diagnostic_questions"
        ) {
          logger.info(
            `🔄 Continuing diagnostic mode for user: ${
              userId?.substring(0, 8) || "unknown"
            }`
          );
          return true;
        }
      }
    }

    const lowerQuery = query.toLowerCase();

    // Only use diagnostic workflow for clear problem indicators
    const problemKeywords = [
      "dying",
      "dead",
      "sick",
      "problem",
      "issue",
      "wrong",
      "help",
      "crispy",
      "wilting",
      "drooping",
      "yellowing",
      "browning",
    ];

    const hasProblems = problemKeywords.some((keyword) =>
      lowerQuery.includes(keyword)
    );

    // Check if image shows clear problems
    const hasImageProblems =
      imageAnalysis &&
      (imageAnalysis.toLowerCase().includes("problem") ||
        imageAnalysis.toLowerCase().includes("damage") ||
        imageAnalysis.toLowerCase().includes("deficiency") ||
        imageAnalysis.toLowerCase().includes("pest"));

    // Only trigger diagnostic for actual problems, not general questions
    return Boolean(hasProblems || hasImageProblems);
  }

  /**
   * Clean up inactive sessions (called by cron job)
   */
  cleanupInactiveSessions(): void {
    this.diagnosticService.cleanupInactiveSessions();
  }

  /**
   * Clear user's chat history
   */
  async clearUserHistory(userId: string): Promise<void> {
    return await this.diagnosticService.clearUserHistory(userId);
  }

  async getUserHistory(userId: string): Promise<any[]> {
    return await this.diagnosticService.getUserHistory(userId);
  }
}
