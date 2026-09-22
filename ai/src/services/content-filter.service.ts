import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { config } from "../config";
import { logger } from "../utils/logger";

interface UserActivity {
  userId: string;
  irrelevantCount: number;
  lastWarning: Date;
  isBlocked: boolean;
  blockUntil?: Date;
}

export class ContentFilterService {
  private model: ChatGoogleGenerativeAI;
  private userActivity: Map<string, UserActivity> = new Map();
  private readonly MAX_IRRELEVANT_QUESTIONS = 3;
  private readonly WARNING_COOLDOWN = 5 * 60 * 1000; // 5 minutes
  private readonly BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: config.ai.googleApiKey,
      modelName: config.ai.model,
      temperature: 0.1,
    });
  }

  async checkRelevance(userId: string, query: string, isDiagnosticAnswer?: boolean): Promise<{
    isRelevant: boolean;
    shouldWarn: boolean;
    shouldBlock: boolean;
    message?: string;
  }> {
    try {
      // Check if user is currently blocked
      const activity = this.getUserActivity(userId);
      if (activity.isBlocked && activity.blockUntil && new Date() < activity.blockUntil) {
        const remainingTime = Math.ceil((activity.blockUntil.getTime() - Date.now()) / 60000);
        return {
          isRelevant: false,
          shouldWarn: false,
          shouldBlock: true,
          message: `You're temporarily blocked for ${remainingTime} minutes due to repeated irrelevant questions. Please ask cannabis-related questions only.`
        };
      }

      // Reset block if expired
      if (activity.isBlocked && activity.blockUntil && new Date() >= activity.blockUntil) {
        activity.isBlocked = false;
        activity.blockUntil = undefined;
        activity.irrelevantCount = 0;
      }

      // Skip content filtering for diagnostic answers
      if (isDiagnosticAnswer) {
        logger.info(`🔍 Bypassing content filter for diagnostic answer: "${query.substring(0, 50)}..."`);
        return {
          isRelevant: true,
          shouldWarn: false,
          shouldBlock: false
        };
      }

      // Check content relevance
      const isRelevant = await this.isQueryRelevant(query);
      
      if (!isRelevant) {
        activity.irrelevantCount++;
        
        if (activity.irrelevantCount >= this.MAX_IRRELEVANT_QUESTIONS) {
          // Block user
          activity.isBlocked = true;
          activity.blockUntil = new Date(Date.now() + this.BLOCK_DURATION);
          
          logger.warn(`User ${userId} blocked for repeated irrelevant questions`);
          
          return {
            isRelevant: false,
            shouldWarn: false,
            shouldBlock: true,
            message: "You've been temporarily blocked for 15 minutes. I can only help with cannabis cultivation questions. Please ask about cannabis growing, plant health, nutrients, or equipment."
          };
        } else {
          // Warn user
          const canWarn = !activity.lastWarning || 
            (Date.now() - activity.lastWarning.getTime()) > this.WARNING_COOLDOWN;
          
          if (canWarn) {
            activity.lastWarning = new Date();
            
            return {
              isRelevant: false,
              shouldWarn: true,
              shouldBlock: false,
              message: `I can only help with cannabis cultivation questions. Please ask about cannabis growing, plant health, nutrients, or equipment. You have ${this.MAX_IRRELEVANT_QUESTIONS - activity.irrelevantCount} more attempts before being temporarily blocked.`
            };
          }
        }
      } else {
        // Reset count on relevant question
        if (activity.irrelevantCount > 0) {
          activity.irrelevantCount = Math.max(0, activity.irrelevantCount - 1);
        }
      }

      return {
        isRelevant,
        shouldWarn: false,
        shouldBlock: false
      };
    } catch (error) {
      logger.error("Content filter error:", error);
      // Allow through on error to avoid blocking legitimate users
      return {
        isRelevant: true,
        shouldWarn: false,
        shouldBlock: false
      };
    }
  }

  private async isQueryRelevant(query: string): Promise<boolean> {
    const relevancePrompt = `You are a content filter for a cannabis cultivation AI assistant. Allow questions about cannabis cultivation and related growing topics that could apply to cannabis.

**RELEVANT TOPICS:**
- Cannabis/marijuana cultivation and growing
- Cannabis plant health, diseases, pests, nutrients
- Cannabis growing equipment, lights, soil, watering
- Cannabis harvesting, drying, curing
- Cannabis hydroponics, growing techniques
- Cannabis seeds, clones, propagation
- Insects, bugs, pests (when could relate to cannabis growing)
- Plant diseases, deficiencies (when could relate to cannabis)
- Growing problems that could affect cannabis
- General cultivation techniques that apply to cannabis

**IRRELEVANT TOPICS (REJECT THESE):**
- Questions specifically about other plants (tomatoes, apples, roses, etc.) with no cannabis context
- Personal questions about the AI
- Completely unrelated topics (sports, politics, cooking, etc.)
- Inappropriate or offensive content
- Questions about illegal activities beyond cultivation
- Random conversations or small talk

**EXAMPLES:**
- "How to grow tomatoes?" = IRRELEVANT (specific other plant)
- "How to grow apple tree?" = IRRELEVANT (specific other plant)
- "Tomato bugs" = IRRELEVANT (specific other plant)
- "How to deal with insects?" = RELEVANT (could be cannabis pests)
- "Plant nutrient deficiency" = RELEVANT (could be cannabis)
- "Cannabis pest control" = RELEVANT
- "Aphids on plants" = RELEVANT (could be cannabis pests)

**USER QUESTION:** "${query}"

If the question could reasonably relate to cannabis cultivation (even if not explicitly mentioned), respond "RELEVANT". Only reject if it's clearly about other specific plants or completely unrelated topics. Respond with ONLY "RELEVANT" or "IRRELEVANT".`;

    const response = await this.model.invoke([
      new SystemMessage(relevancePrompt),
      new HumanMessage("Is this question relevant to cannabis cultivation?")
    ]);

    const result = (response.content as string).trim().toUpperCase();
    return result === "RELEVANT";
  }

  private getUserActivity(userId: string): UserActivity {
    if (!this.userActivity.has(userId)) {
      this.userActivity.set(userId, {
        userId,
        irrelevantCount: 0,
        lastWarning: new Date(0),
        isBlocked: false
      });
    }
    return this.userActivity.get(userId)!;
  }

  async checkProspectRelevance(userId: string, query: string): Promise<{
    isRelevant: boolean;
    shouldWarn: boolean;
    shouldBlock: boolean;
    message?: string;
  }> {
    try {
      // Check if user is currently blocked
      const activity = this.getUserActivity(userId);
      if (activity.isBlocked && activity.blockUntil && new Date() < activity.blockUntil) {
        const remainingTime = Math.ceil((activity.blockUntil.getTime() - Date.now()) / 60000);
        return {
          isRelevant: false,
          shouldWarn: false,
          shouldBlock: true,
          message: `You're temporarily blocked for ${remainingTime} minutes. Please ask questions about QPG courses, cannabis cultivation, or our services.`
        };
      }

      // Reset block if expired
      if (activity.isBlocked && activity.blockUntil && new Date() >= activity.blockUntil) {
        activity.isBlocked = false;
        activity.blockUntil = undefined;
        activity.irrelevantCount = 0;
      }

      // Check content relevance for prospects
      const isRelevant = await this.isProspectQueryRelevant(query);
      
      if (!isRelevant) {
        activity.irrelevantCount++;
        
        if (activity.irrelevantCount >= this.MAX_IRRELEVANT_QUESTIONS) {
          // Block user
          activity.isBlocked = true;
          activity.blockUntil = new Date(Date.now() + this.BLOCK_DURATION);
          
          logger.warn(`Prospect ${userId} blocked for repeated irrelevant questions`);
          
          return {
            isRelevant: false,
            shouldWarn: false,
            shouldBlock: true,
            message: "You've been temporarily blocked for 15 minutes. I can only help with QPG courses, cannabis cultivation, refund policy, or our services."
          };
        } else {
          // Warn user
          const canWarn = !activity.lastWarning || 
            (Date.now() - activity.lastWarning.getTime()) > this.WARNING_COOLDOWN;
          
          if (canWarn) {
            activity.lastWarning = new Date();
            
            return {
              isRelevant: false,
              shouldWarn: true,
              shouldBlock: false,
              message: `I can only help with QPG courses, cannabis cultivation, refund policy, or our services. You have ${this.MAX_IRRELEVANT_QUESTIONS - activity.irrelevantCount} more attempts before being temporarily blocked.`
            };
          }
        }
      } else {
        // Reset count on relevant question
        if (activity.irrelevantCount > 0) {
          activity.irrelevantCount = Math.max(0, activity.irrelevantCount - 1);
        }
      }

      return {
        isRelevant,
        shouldWarn: false,
        shouldBlock: false
      };
    } catch (error) {
      logger.error("Prospect content filter error:", error);
      // Allow through on error to avoid blocking legitimate prospects
      return {
        isRelevant: true,
        shouldWarn: false,
        shouldBlock: false
      };
    }
  }

  private async isProspectQueryRelevant(query: string): Promise<boolean> {
    const relevancePrompt = `You are a content filter for QPG (Quantum Plant Growing) prospect chat. Allow questions about QPG business, courses, and cannabis cultivation.

**RELEVANT TOPICS FOR PROSPECTS:**
- QPG course questions (content, structure, pricing, access)
- Cannabis/marijuana cultivation and growing
- Cannabis plant health, diseases, pests, nutrients
- Cannabis growing equipment, lights, soil, watering
- Cannabis harvesting, drying, curing
- QPG refund policy and satisfaction guarantee
- QPG Plant Clinic features
- Course enrollment and tuition
- QPG brand, methods, and value proposition
- Cost savings vs dispensary prices
- Purity, quality, and customization benefits
- General cultivation techniques that apply to cannabis
- Growing problems that could affect cannabis

**IRRELEVANT TOPICS (REJECT THESE):**
- Questions specifically about other plants (tomatoes, apples, roses, etc.) with no cannabis context
- Personal questions about the AI unrelated to QPG
- Completely unrelated topics (sports, politics, cooking, etc.)
- Inappropriate or offensive content
- Questions about illegal activities beyond cultivation
- Random conversations or small talk
- Competitor products or services

**EXAMPLES:**
- "What's your refund policy?" = RELEVANT (QPG business)
- "How much does the course cost?" = RELEVANT (QPG course)
- "Cannabis pest control" = RELEVANT (cannabis cultivation)
- "How to grow tomatoes?" = IRRELEVANT (other plants)
- "What's the weather like?" = IRRELEVANT (unrelated)
- "Tell me about your Plant Clinic" = RELEVANT (QPG service)

**USER QUESTION:** "${query}"

If the question relates to QPG business, courses, or cannabis cultivation, respond "RELEVANT". Only reject if it's clearly unrelated to QPG or cannabis. Respond with ONLY "RELEVANT" or "IRRELEVANT".`;

    const response = await this.model.invoke([
      new SystemMessage(relevancePrompt),
      new HumanMessage("Is this question relevant to QPG or cannabis cultivation?")
    ]);

    const result = (response.content as string).trim().toUpperCase();
    return result === "RELEVANT";
  }

  // Clean up old activity data (call periodically)
  cleanupOldActivity(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    for (const [userId, activity] of this.userActivity.entries()) {
      if (activity.lastWarning.getTime() < cutoff && !activity.isBlocked) {
        this.userActivity.delete(userId);
      }
    }
    
    logger.debug(`Cleaned up old user activity data. Active users: ${this.userActivity.size}`);
  }
}