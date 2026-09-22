import { DatabaseService } from "./database.service";
import { DiagnosticTriageService } from "./diagnostic/diagnostic-triage.service";
import { DiagnosticQuestionsService } from "./diagnostic/diagnostic-questions.service";
import { DiagnosticSolutionsService } from "./diagnostic/diagnostic-solutions.service";
import { SessionManagerService } from "./chat/session-manager.service";
import { SimpleQueryService } from "./chat/simple-query.service";
import { logger } from "../utils/logger";
import { ChatMessage, User } from "../types";

export class DiagnosticService {
  private databaseService: DatabaseService;
  private triageService: DiagnosticTriageService;
  private questionsService: DiagnosticQuestionsService;
  private solutionsService: DiagnosticSolutionsService;
  private sessionManager: SessionManagerService;
  private simpleQueryService: SimpleQueryService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
    this.triageService = new DiagnosticTriageService();
    this.questionsService = new DiagnosticQuestionsService();
    this.solutionsService = new DiagnosticSolutionsService(databaseService);
    this.sessionManager = new SessionManagerService(databaseService);
    this.simpleQueryService = new SimpleQueryService(databaseService);
  }

  async processDiagnosticQuery(
    userId: string,
    query: string,
    userProfile: User,
    imageAnalysis?: string,
    stage?: string,
    week?: number,
    day?: number
  ): Promise<{ response: string; metadata: any }> {
    logger.info(
      `🔍 Starting diagnostic workflow for user: ${
        userId?.substring(0, 8) || "unknown"
      }`
    );

    try {
      // Check if image analysis indicates non-cannabis content
      if (imageAnalysis?.startsWith("NOT_CANNABIS_PLANT:")) {
        const actualContent = imageAnalysis.replace("NOT_CANNABIS_PLANT:", "").trim();
        logger.info(`❌ Non-cannabis image detected for user: ${userId?.substring(0, 8) || "unknown"} - ${actualContent}`);
        
        return {
          response: `I can see that this image shows ${actualContent}. I'm specifically designed to help with cannabis cultivation issues. Please share an image of your cannabis plant, and I'll be happy to help you identify any problems and provide solutions based on our proven QPG protocols.`,
          metadata: {
            userId,
            type: "image_validation_failed",
            actualContent,
            processedAt: new Date().toISOString(),
          },
        };
      }

      // Handle empty query (image-only uploads)
      if (!query || query.trim() === "") {
        query = imageAnalysis
          ? "Please analyze this image and help me with any issues you can identify"
          : "Can you please check what is wrong? First give me some short description about the issue then give me solution";
      }

      // STEP 1: TRIAGE AND INITIAL ANALYSIS
      const issueType = await this.triageService.analyzeIssueType(
        query,
        imageAnalysis
      );
      logger.info(`📋 Step 1 - Issue identified as: ${issueType}`);

      // Handle healthy plants immediately
      if (issueType === "healthy") {
        return await this.solutionsService.generateHealthyResponse(
          query,
          imageAnalysis
        );
      }

      // Handle pest issues directly (no questions needed per requirements)
      if (issueType === "pest") {
        return await this.solutionsService.generatePestResponse(
          query,
          imageAnalysis,
          stage
        );
      }

      // STEP 2: INTERACTIVE DIAGNOSIS VIA CLARIFYING QUESTIONS (for Foundational Issues)
      const session = await this.sessionManager.getUserSession(userId);
      const lastAiMessage = session?.messages
        ?.filter((m: any) => m.role === "assistant")
        .pop();

      const isAnsweringQuestions = lastAiMessage
        ? await this.questionsService.isUserAnsweringQuestions(
            lastAiMessage,
            query
          )
        : false;

      logger.info(
        `🔍 Diagnostic check - isAnsweringQuestions: ${isAnsweringQuestions} for user: ${
          userId?.substring(0, 8) || "unknown"
        }`
      );

      if (isAnsweringQuestions) {
        // Get the original issue type from the last AI message metadata
        const originalIssueType =
          lastAiMessage?.metadata?.issueType || issueType;

        logger.info(
          `📋 Step 3 - Providing synthesis for user: ${
            userId?.substring(0, 8) || "unknown"
          }, using original issue type: ${originalIssueType}`
        );

        // STEP 3: SYNTHESIS AND RECOMMENDATION - use original issue type
        const conversationContext = session.messages
          .slice(-6)
          .map((m: any) => `${m.role}: ${m.content}`)
          .join("\n");

        const cultivationContext =
          await this.sessionManager.getCultivationContext(userId, stage, week, day);
        const cultivationInfo = await this.sessionManager.getCultivationInfo(
          userId,
          stage,
          week,
          day
        );

        return await this.solutionsService.generateSolution(
          userId,
          query,
          originalIssueType,
          conversationContext,
          cultivationContext,
          cultivationInfo.stage,
          cultivationInfo.week,
          cultivationInfo.day
        );
      } else {
        logger.info(
          `📋 Step 2 - Asking questions for user: ${
            userId?.substring(0, 8) || "unknown"
          }`
        );

        // STEP 2: Ask targeted questions
        const cultivationContext =
          await this.sessionManager.getCultivationContext(userId, stage, week, day);
        const cultivationInfo = await this.sessionManager.getCultivationInfo(
          userId,
          stage,
          week,
          day
        );

        return await this.questionsService.generateQuestions(
          userId,
          query,
          issueType,
          imageAnalysis,
          cultivationContext,
          cultivationInfo.stage,
          cultivationInfo.week,
          cultivationInfo.day
        );
      }
    } catch (error) {
      logger.error("Diagnostic workflow failed:", error);
      return {
        response:
          "I'm having some technical difficulties right now. Could you describe what's happening with your plant and I'll do my best to help?",
        metadata: {
          userId,
          error: "diagnostic_workflow_failed",
          processedAt: new Date().toISOString(),
        },
      };
    }
  }

  async processSimpleQuery(
    userId: string,
    query: string,
    userProfile: User,
    chatHistory: ChatMessage[],
    imageAnalysis?: string
  ): Promise<{ response: string; metadata: any }> {
    logger.info(
      `🤖 Processing simple query for user: ${
        userId?.substring(0, 8) || "unknown"
      }`
    );

    return await this.simpleQueryService.processQuery(
      userId,
      query,
      chatHistory,
      imageAnalysis
    );
  }

  // Expose session manager methods
  async getUserSession(userId: string): Promise<any> {
    return await this.sessionManager.getUserSession(userId);
  }

  async storeMessages(
    userId: string,
    userMessage: ChatMessage,
    aiMessage: ChatMessage,
    stage?: string,
    week?: number,
    day?: number
  ): Promise<void> {
    return await this.sessionManager.storeMessages(
      userId,
      userMessage,
      aiMessage,
      stage,
      week,
      day
    );
  }

  cleanupInactiveSessions(): void {
    this.sessionManager.cleanupInactiveSessions();
  }

  async clearUserHistory(userId: string): Promise<void> {
    return await this.sessionManager.clearUserHistory(userId);
  }

  async getUserHistory(userId: string): Promise<any[]> {
    return await this.sessionManager.getUserHistory(userId);
  }
}
