import { DatabaseService } from "../database.service";
import { logger } from "../../utils/logger";
import { ChatMessage } from "../../types";

export class SessionManagerService {
  private userSessions: Map<string, any> = new Map();
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  async getUserSession(userId: string): Promise<any> {
    // Check memory cache first
    if (this.userSessions.has(userId)) {
      const session = this.userSessions.get(userId);
      const now = new Date();
      const lastActive = new Date(session.lastActive);
      const hoursDiff =
        (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        return session;
      } else {
        this.userSessions.delete(userId);
      }
    }

    // Load from database
    const dbSession = await this.databaseService.getUserSession(userId);
    if (dbSession) {
      this.userSessions.set(userId, dbSession);
      logger.info(
        `Loaded session for user: ${
          userId?.substring(0, 8) || "unknown"
        } with ${dbSession.messages.length} messages`
      );
    }
    return dbSession;
  }

  async storeMessages(
    userId: string,
    userMessage: ChatMessage,
    aiMessage: ChatMessage,
    stage?: string,
    week?: number,
    day?: number
  ): Promise<void> {
    try {
      // Store cultivation info first if provided from frontend
      if (stage || week !== undefined || day !== undefined) {
        await this.storeCultivationInfo(userId, stage, week, day);
      }

      // Also try to extract cultivation info from user's message content
      const extractedInfo = this.extractCultivationFromMessage(
        userMessage.content
      );
      if (
        extractedInfo.stage ||
        extractedInfo.week !== undefined ||
        extractedInfo.day !== undefined
      ) {
        await this.storeCultivationInfo(
          userId,
          extractedInfo.stage,
          extractedInfo.week,
          extractedInfo.day
        );
        logger.info(
          `📋 Auto-extracted cultivation info from user message: Stage=${extractedInfo.stage}, Week=${extractedInfo.week}, Day=${extractedInfo.day}`
        );
      }

      // Store the conversation messages
      await this.databaseService.saveUserMessage(
        userId,
        userMessage,
        aiMessage
      );

      // Clear cache to force fresh load on next request
      this.userSessions.delete(userId);
    } catch (error) {
      logger.error("Error storing messages:", error);
      throw error;
    }
  }

  async getCultivationContext(
    userId: string,
    stage?: string,
    week?: number,
    day?: number
  ): Promise<string> {
    try {
      const session = await this.getUserSession(userId);
      if (!session?.messages) {
        return this.formatCultivationContext(stage, week, day);
      }

      // Find cultivation context in session
      const cultivationMessage = session.messages.find(
        (m: any) =>
          m.role === "system" && m.content?.includes("CULTIVATION_INFO:")
      );

      if (cultivationMessage?.metadata) {
        const sessionStage = cultivationMessage.metadata.stage || stage;
        const sessionWeek =
          cultivationMessage.metadata.week !== undefined
            ? cultivationMessage.metadata.week
            : week;
        const sessionDay =
          cultivationMessage.metadata.day !== undefined
            ? cultivationMessage.metadata.day
            : day;
        return this.formatCultivationContext(
          sessionStage,
          sessionWeek,
          sessionDay
        );
      }

      return this.formatCultivationContext(stage, week, day);
    } catch (error) {
      logger.error("Error getting cultivation context:", error);
      return "";
    }
  }

  async getCultivationInfo(
    userId: string,
    stage?: string,
    week?: number,
    day?: number
  ): Promise<{ stage?: string; week?: number; day?: number }> {
    try {
      const session = await this.getUserSession(userId);
      if (!session?.messages) {
        return { stage, week, day };
      }

      // Find cultivation context in session
      const cultivationMessage = session.messages.find(
        (m: any) =>
          m.role === "system" && m.content?.includes("CULTIVATION_INFO:")
      );

      if (cultivationMessage?.metadata) {
        return {
          stage: cultivationMessage.metadata.stage || stage,
          week:
            cultivationMessage.metadata.week !== undefined
              ? cultivationMessage.metadata.week
              : week,
          day:
            cultivationMessage.metadata.day !== undefined
              ? cultivationMessage.metadata.day
              : day,
        };
      }

      return { stage, week, day };
    } catch (error) {
      logger.error("Error getting cultivation info:", error);
      return { stage, week, day };
    }
  }

  private async storeCultivationInfo(
    userId: string,
    stage?: string,
    week?: number,
    day?: number
  ): Promise<void> {
    try {
      if (!stage && week === undefined && day === undefined) return;

      const session = await this.getUserSession(userId);
      if (!session) return;

      const messages = session.messages || [];

      // Remove existing cultivation info
      const filteredMessages = messages.filter(
        (msg: any) =>
          msg.role !== "system" || !msg.content?.includes("CULTIVATION_INFO:")
      );

      // Create new cultivation info message
      const cultivationInfo = {
        id: `cultivation-info-${Date.now()}`,
        content: `CULTIVATION_INFO: Stage=${stage || "not_set"}, Week=${
          week !== undefined ? week : "not_set"
        }, Day=${day !== undefined ? day : "not_set"}`,
        role: "system",
        timestamp: new Date().toISOString(),
        metadata: {
          type: "cultivation_info",
          stage: stage,
          week: week,
          day: day,
          updatedAt: new Date().toISOString(),
        },
      };

      // Add cultivation info at the beginning
      const updatedMessages = [cultivationInfo, ...filteredMessages];

      // Update database
      await (this.databaseService as any).pool.query(
        `UPDATE user_sessions SET messages = $1, last_active = CURRENT_TIMESTAMP WHERE user_id = $2`,
        [JSON.stringify(updatedMessages), userId]
      );

      logger.info(
        `📋 Stored cultivation details: Stage=${stage || "unchanged"}, Week=${
          week !== undefined ? week : "unchanged"
        }, Day=${day !== undefined ? day : "unchanged"}`
      );
    } catch (error) {
      logger.error("Error storing cultivation info:", error);
    }
  }

  cleanupInactiveSessions(): void {
    const now = new Date();
    for (const [userId, session] of this.userSessions.entries()) {
      const lastActive = new Date(session.lastActive);
      const hoursDiff =
        (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        this.userSessions.delete(userId);
        logger.debug(`Cleaned up inactive session for user ${userId}`);
      }
    }
    logger.debug(
      `Session cleanup completed. ${this.userSessions.size} active sessions remaining.`
    );
  }

  async clearUserHistory(userId: string): Promise<void> {
    try {
      await this.databaseService.clearUserMessages(userId);
      this.userSessions.delete(userId);
      logger.info(`Chat history cleared for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to clear chat history for user ${userId}:`, error);
      throw error;
    }
  }

  async getUserHistory(userId: string): Promise<any[]> {
    const session = await this.getUserSession(userId);
    return session?.messages || [];
  }

  private extractCultivationFromMessage(content: string): {
    stage?: string;
    week?: number;
    day?: number;
  } {
    const lowerContent = content.toLowerCase();
    let stage: string | undefined;
    let week: number | undefined;
    let day: number | undefined;

    // Extract stage
    if (lowerContent.includes("vegetative") || lowerContent.includes("veg")) {
      stage = "vegetative";
    } else if (
      lowerContent.includes("flowering") ||
      lowerContent.includes("flower") ||
      lowerContent.includes("bloom")
    ) {
      stage = "flowering";
    } else if (lowerContent.includes("seedling")) {
      stage = "seedling";
    }

    // Extract week number
    const weekMatches =
      content.match(/week\s*(\d+)/i) || content.match(/(\d+)\s*week/i);
    if (weekMatches) {
      const weekNum = parseInt(weekMatches[1]);
      if (weekNum >= 1 && weekNum <= 20) {
        // reasonable range
        week = weekNum;
      }
    }

    // Extract day number (for flowering stage)
    const dayMatches =
      content.match(/day\s*(\d+)/i) || content.match(/(\d+)\s*day/i);
    if (dayMatches) {
      const dayNum = parseInt(dayMatches[1]);
      if (dayNum >= 1 && dayNum <= 84) {
        // reasonable range for flowering days
        day = dayNum;
      }
    }

    return { stage, week, day };
  }

  private formatCultivationContext(
    stage?: string,
    week?: number,
    day?: number
  ): string {
    if (!stage && week === undefined && day === undefined) {
      return "";
    }

    let context = "\n**CULTIVATION CONTEXT:**\n";

    if (stage) {
      context += `- Stage: ${stage}\n`;
    }

    // For flowering stage, prioritize day number over week
    if (stage === "flowering") {
      if (day !== undefined) {
        context += `- Day: ${day} (flowering)\n`;
      } else if (week !== undefined) {
        context += `- Week: ${week} (flowering)\n`;
      }
    } else {
      // For non-flowering stages, use week number
      if (week !== undefined) {
        context += `- Week: ${week}\n`;
      } else if (day !== undefined) {
        // Convert day to week for non-flowering stages
        const convertedWeek = Math.ceil(day / 7);
        context += `- Week: ${convertedWeek} (converted from day ${day})\n`;
      }
    }

    return context;
  }
}
