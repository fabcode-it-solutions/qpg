import { v4 as uuidv4 } from "uuid";
import { DatabaseService } from "./database.service";
import { GeminiService } from "./gemini.service";
import { logger } from "../utils/logger";
import { ChatMessage, User } from "../types";

export class ProspectChatService {
  private databaseService: DatabaseService;
  private geminiService: GeminiService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
    this.geminiService = new GeminiService();
  }

  async handleProspectMessage(
    prospectId: string,
    message: string,
    conversationHistory: ChatMessage[] = [],
    prospectContext?: any
  ): Promise<{ userMessage: ChatMessage; aiResponse: ChatMessage }> {
    logger.info(
      `Processing prospect message from: ${prospectId.substring(0, 12)}`
    );

    // Create user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      userId: prospectId,
      content: message,
      role: "user",
      timestamp: new Date(),
    };

    // Store prospect message in database
    await this.storeProspectMessage(userMessage);

    // Generate AI response with prospect-specific context
    const aiContent = await this.generateProspectResponse(
      message,
      conversationHistory,
      prospectContext
    );

    const aiMessage: ChatMessage = {
      id: uuidv4(),
      userId: prospectId,
      content: aiContent.content,
      role: "assistant",
      timestamp: new Date(),
      metadata: {
        followUpQuestions: aiContent.followUpQuestions,
        category: "prospect_sales",
        userType: "prospect",
      },
    };

    // Store AI response in database
    await this.storeProspectMessage(aiMessage);

    return { userMessage, aiResponse: aiMessage };
  }

  private async generateProspectResponse(
    message: string,
    conversationHistory: ChatMessage[],
    prospectContext?: any
  ) {
    // Get course syllabus from database (same as Facebook service)
    let courseSyllabus = "";
    if (this.databaseService) {
      try {
        const syllabusProtocols = await this.databaseService.searchProtocols(
          "QPG course syllabus overview",
          "course-syllabus-new",
          3
        );
        courseSyllabus = syllabusProtocols
          .map((p: any) => p.pageContent)
          .join("\n\n");
      } catch (error) {
        logger.warn("Failed to fetch course syllabus from database:", error);
        courseSyllabus =
          "QPG Course: Comprehensive cannabis cultivation training with lifetime access, 24/7 AI support, and proven protocols for maximum yield and quality.";
      }
    } else {
      courseSyllabus =
        "QPG Course: Comprehensive cannabis cultivation training with lifetime access, 24/7 AI support, and proven protocols for maximum yield and quality.";
    }

    try {
      const response = await this.generateBrandAmbassadorResponse(
        message,
        prospectContext || "",
        courseSyllabus
      );

      return {
        content: response,
        followUpQuestions: [],
      };
    } catch (error) {
      logger.error("Error generating prospect response:", error);
      const coursesUrl = this.getCoursesUrl();
      return {
        content: `Thanks for your interest in Quantum Plant Growing! I'm Q, your personal cannabis cultivation consultant. Our revolutionary quantum method has helped thousands of growers increase their yields by 40-60% on average.\n\nOur comprehensive courses cover everything from seed selection to harvest optimization, with expert instruction and live community support. You can explore all our courses and enroll at: ${coursesUrl}\n\nWhat specific growing challenges are you facing that I can help you solve?`,
        followUpQuestions: [],
      };
    }
  }

  private async generateBrandAmbassadorResponse(
    userMessage: string,
    postContext: string,
    courseSyllabus: string
  ): Promise<string> {
    const systemPrompt = `You are Q, an expert, scientific, and trusted advocate for QPG (Quantum Plant Growing). You embody the "Gold Standard" brand identity - intelligent, helpful, and authoritative, but never salesy.

**CORE PERSONA:**
You are an expert, scientific, and trusted advocate, NOT a salesman. Your responses are intelligent, helpful, and aligned with the "Gold Standard" brand identity.

**PRIMARY FUNCTIONS (PERMITTED TOPICS):**

1. **Answer Course Questions:** Discuss the course structure including four main videos:
   - Grow room setup
   - Seedling and vegetative stage  
   - Flowering stage
   - Harvest/drying/curing
   Also discuss tuition and access model.

2. **Promote Brand Value using these marketing hooks:**
   - **Cost Savings:** Highlight affordability of home growing vs dispensary prices
   - **Purity & Quality:** Reference risks of pesticides and improper curing in commercial products
   - **Efficacy & Customization:** Explain how the course teaches growing for specific, nuanced effects

3. **Explain Refund Policy:** If a customer asks you for a refund, Confirm their request aligns with our 100% Satisfaction Guarantee. Direct them to fill out the secure "QPG Refund Request" form, which we've planned for the quantumpotgrow.com/refund page. Explain that this form sends their details directly to you (the billing department) for processing. This ensures you get an immediate email notification for every refund request, solving our workflow gap. 

4. **Introduce Plant Clinic:** Present advanced diagnostic capabilities as premium feature for enrolled students using this script:
   "I can answer any general questions you have about the QPG course and its benefits right now. For our enrolled students, my role expands within our exclusive 'Plant Clinic.' There, I act as a 24/7 expert diagnostic tool. Students can upload photos of their plants, and I can analyze them to identify problems and provide instant, step-by-step solutions based on official QPG protocols."

5. **Introduce Yourself:** As the AI assistant Q, I am the core of the private, members-only Plant Clinic. My expertise is the complete Quantum Pot Grow cultivation system. Members can interact with me 24/7 by uploading photos and describing their issues. I can visually analyze these images and use our established diagnostic workflow to provide a real-time diagnosis for any nutritional, environmental, or pest-related problems.

**KEY RESTRICTION (PROHIBITED TOPICS):**

**Proprietary Methods:** To protect the value of the paid course, DO NOT explain specific "how-to" details of proprietary cultivation techniques (e.g., "Strain Lock"). When asked a "how-to" question, pivot to focus on the BENEFIT of the method, framing the technique itself as a key reason to enroll.

**RESPONSE GUIDELINES:**
- Be expert, scientific, and trusted - never salesy
- Focus on education and value
- Protect proprietary methods while highlighting their benefits
- Guide toward enrollment through value demonstration
- Include course link: "${this.getCoursesUrl()}"

User Message: "${userMessage}"
Context: "${postContext}"
Course Info: ${courseSyllabus}

Respond as the expert, scientific advocate Q, following the guidelines above.`;

    const context = {
      userId: "prospect-brand-ambassador",
      sessionId: "prospect-brand",
      messageHistory: [],
      userProfile: {
        id: "prospect-brand-ambassador",
        name: "Q Prospect Ambassador",
        email: "",
        membershipLevel: "basic" as const,
        createdAt: new Date(),
        lastActive: new Date(),
      },
      relevantProtocols: [],
    };

    const response = await this.geminiService.generateResponse(
      context,
      systemPrompt
    );

    logger.info(`🎯 Expert advocate response generated`, {
      userMessage: userMessage.substring(0, 100),
      responseLength: response.content.length,
    });

    return response.content;
  }

  private getCoursesUrl(): string {
    const { config } = require("../config");
    const baseUrl =
      config.facebook.plantClinicUrl || "https://quantumplantgrowing.com";
    return `${baseUrl}/courses`;
  }

  private generateProspectFollowUps(message: string): string[] {
    // Return empty array - Q should answer questions, not ask them
    return [];
  }

  private async storeProspectMessage(message: ChatMessage): Promise<void> {
    try {
      const query = `
        INSERT INTO chat_messages (id, user_id, user_type, role, content, metadata, timestamp, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await this.databaseService["pool"].query(query, [
        message.id,
        message.userId,
        "prospect",
        message.role,
        message.content,
        message.metadata ? JSON.stringify(message.metadata) : null,
        message.timestamp,
        new Date(),
      ]);
    } catch (error) {
      logger.error("Error storing prospect message:", error);
    }
  }

  async getProspectHistory(prospectId: string): Promise<ChatMessage[]> {
    try {
      const query = `
        SELECT * FROM chat_messages 
        WHERE user_id = $1 AND user_type = 'prospect'
        ORDER BY timestamp ASC
      `;

      const result = await this.databaseService["pool"].query(query, [
        prospectId,
      ]);

      return result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        content: row.content,
        role: row.role,
        timestamp: new Date(row.timestamp),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      }));
    } catch (error) {
      logger.error("Error getting prospect history:", error);
      return [];
    }
  }

  async clearProspectHistory(prospectId: string): Promise<void> {
    try {
      const query = `
        DELETE FROM chat_messages 
        WHERE user_id = $1 AND user_type = 'prospect'
      `;

      await this.databaseService["pool"].query(query, [prospectId]);
      logger.info(
        `Cleared prospect history for: ${prospectId.substring(0, 12)}`
      );
    } catch (error) {
      logger.error("Error clearing prospect history:", error);
    }
  }
}
