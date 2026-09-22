import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { DatabaseService } from "../database.service";
import { config } from "../../config";
import { logger } from "../../utils/logger";
import { ChatMessage } from "../../types";

export class SimpleQueryService {
  private model: ChatGoogleGenerativeAI;
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
    this.model = new ChatGoogleGenerativeAI({
      apiKey: config.ai.googleApiKey,
      modelName: config.ai.model,
      temperature: 0.2,
    });
  }

  async processQuery(
    userId: string,
    query: string,
    chatHistory: ChatMessage[],
    imageAnalysis?: string
  ): Promise<{ response: string; metadata: any }> {
    const lastAiMessage = chatHistory.filter((m) => m.role === "assistant").pop();

    // Check if user is answering a previous question
    const isAnswering = await this.isUserAnsweringPreviousQuestion(chatHistory, query);

    if (isAnswering && lastAiMessage) {
      return await this.handleAnswerAnalysis(userId, query, lastAiMessage, chatHistory, imageAnalysis);
    } else {
      // Double-check relevance - only block obvious non-cannabis plants
      const lowerQuery = query.toLowerCase();
      const specificNonCannabisPlants = ['tomato', 'apple', 'rose', 'corn', 'wheat', 'carrot', 'lettuce', 'spinach'];
      const hasSpecificNonCannabisPlants = specificNonCannabisPlants.some(plant => lowerQuery.includes(plant));
      const hasCannabisOrGrowingKeywords = ['cannabis', 'marijuana', 'weed', 'plant', 'grow', 'bud', 'leaf', 'stem', 'cultivation', 'growing', 'pest', 'insect', 'bug', 'disease', 'nutrient'].some(keyword => lowerQuery.includes(keyword));
      
      if (hasSpecificNonCannabisPlants && !hasCannabisOrGrowingKeywords) {
        return {
          response: "I can only help with cannabis cultivation questions. Please ask about cannabis growing, plant health, nutrients, or equipment.",
          metadata: {
            userId,
            category: "content_filter",
            agent_used: "filter",
            processedAt: new Date().toISOString(),
            workflow: "content_blocked",
          },
        };
      }
      
      return await this.handleNewQuery(userId, query, chatHistory, imageAnalysis);
    }
  }

  private async handleAnswerAnalysis(
    userId: string,
    query: string,
    lastAiMessage: ChatMessage,
    chatHistory: ChatMessage[],
    imageAnalysis?: string
  ): Promise<{ response: string; metadata: any }> {
    logger.info(`💬 User answering previous question for user: ${userId?.substring(0, 8) || "unknown"}`);
    
    const previousTopic = lastAiMessage.metadata?.category || 
      (await this.identifyTopic(lastAiMessage.content || "", imageAnalysis));

    const protocol = await this.getProtocolForCategory(previousTopic);
    const cultivationContext = await this.getCultivationContext(userId);

    const answerAnalysisPrompt = `You are a cannabis cultivation expert using the QPG method. The user has provided an answer to your previous question. Analyze their answer in the context of the previous conversation and the relevant QPG protocol. Provide a direct, helpful response or solution based on their answer and the protocol.

**CONVERSATION CONTEXT:**
${chatHistory.slice(-4).map((m) => `${m.role}: ${m.content}`).join("\n")}
user: ${query}

**QPG PROTOCOL FOR ${previousTopic.toUpperCase()}:**
${protocol}

${cultivationContext}

**INSTRUCTIONS:**
- Acknowledge the user's answer.
- If the answer provides enough information, give a direct solution or detailed information from the protocol.
- If the answer is incomplete or unclear, ask a follow-up question to get the necessary details.
- Do NOT ask questions if you have enough information to provide a solution.
- Be specific with measurements, timing, and steps from the protocol.
- Be conversational but authoritative.

Provide a complete, helpful answer based on proven QPG methods.`;

    const response = await this.model.invoke([
      new SystemMessage(answerAnalysisPrompt),
      new HumanMessage(query || "Please analyze my previous response"),
    ]);

    return {
      response: response.content as string,
      metadata: {
        userId,
        category: previousTopic,
        agent_used: previousTopic,
        processedAt: new Date().toISOString(),
        workflow: "simple_answer_analysis",
      },
    };
  }

  private async handleNewQuery(
    userId: string,
    query: string,
    chatHistory: ChatMessage[],
    imageAnalysis?: string
  ): Promise<{ response: string; metadata: any }> {
    // Check for topic change
    const topicChangeResult = await this.checkTopicChange(chatHistory, query, imageAnalysis);
    if (topicChangeResult) {
      return topicChangeResult;
    }

    // Process new query
    logger.info(`📂 Processing new query for user: ${userId?.substring(0, 8) || "unknown"}`);
    
    const category = await this.identifyTopic(query, imageAnalysis);
    const protocol = await this.getProtocolForCategory(category);
    const cultivationContext = await this.getCultivationContext(userId);
    const nutritionInfo = await this.getNutritionInfo(query, cultivationContext);

    const answerPrompt = `You are Q, a cannabis cultivation expert using the QPG method. Provide a direct, helpful answer to the user's question.

User Question: "${query}"
${imageAnalysis ? `Image Analysis: ${imageAnalysis}` : ""}

**QPG PROTOCOL:**
${protocol}

${cultivationContext}
${nutritionInfo}

**INSTRUCTIONS:**
- Give a direct answer using QPG protocols
- Be specific with measurements and timing
- Don't ask questions unless absolutely necessary
- If the user asks about problems, provide solutions immediately
- Keep responses focused and actionable
- For feeding questions, provide specific product recommendations and mixing instructions
- Only answer cannabis cultivation questions
- If somehow a non-cannabis question gets through, politely redirect to cannabis topics

Provide a complete answer based on QPG methods.`;

    const response = await this.model.invoke([
      new SystemMessage(answerPrompt),
      new HumanMessage(query || "Please provide guidance based on the protocol"),
    ]);

    return {
      response: response.content as string,
      metadata: {
        userId,
        category,
        agent_used: category,
        processedAt: new Date().toISOString(),
        workflow: "simple_2_api_call",
      },
    };
  }

  private async checkTopicChange(
    chatHistory: ChatMessage[],
    query: string,
    imageAnalysis?: string
  ): Promise<{ response: string; metadata: any } | null> {
    const conversationSummaryPrompt = `Summarize the main topic of the following conversation. If there isn't a clear topic or it's a greeting, respond with "general".

**CONVERSATION HISTORY:**
${chatHistory.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n")}

Respond with ONLY the main topic (e.g., "watering", "nutrients", "general").`;

    const currentTopicResponse = await this.model.invoke([
      new SystemMessage(conversationSummaryPrompt),
      new HumanMessage("Please summarize the conversation topic")
    ]);
    
    const currentTopic = (currentTopicResponse.content as string).trim().toLowerCase();
    const newQueryTopic = await this.identifyTopic(query, imageAnalysis);

    const isTopicChange = currentTopic !== "general" && 
                         newQueryTopic !== "general" && 
                         currentTopic !== newQueryTopic;

    if (isTopicChange) {
      logger.info(`🔄 Topic change detected from ${currentTopic} to ${newQueryTopic} - switching directly`);
      
      // Directly process the new topic instead of asking for confirmation
      const protocol = await this.getProtocolForCategory(newQueryTopic);
      const cultivationContext = await this.getCultivationContext(chatHistory[0]?.userId || "");
      const nutritionInfo = await this.getNutritionInfo(query, cultivationContext);

      const topicChangePrompt = `You are Q, a cannabis cultivation expert. The user has changed topics from ${currentTopic} to ${newQueryTopic}. Acknowledge the topic change briefly and then provide a direct, helpful answer.

User Question: "${query}"
${imageAnalysis ? `Image Analysis: ${imageAnalysis}` : ""}

**QPG PROTOCOL FOR ${newQueryTopic.toUpperCase()}:**
${protocol}

${cultivationContext}
${nutritionInfo}

**INSTRUCTIONS:**
- Start with: "I see you're asking about ${newQueryTopic} now."
- Give a direct, complete answer using QPG protocols
- Be specific with measurements, timing, and product recommendations
- Don't ask for confirmation about the topic change

Provide a complete answer based on QPG methods.`;

      const response = await this.model.invoke([
        new SystemMessage(topicChangePrompt),
        new HumanMessage(query || "Please provide guidance")
      ]);

      return {
        response: response.content as string,
        metadata: {
          category: newQueryTopic,
          agent_used: newQueryTopic,
          processedAt: new Date().toISOString(),
          workflow: "topic_change_direct",
          previousTopic: currentTopic,
        },
      };
    }

    return null;
  }

  async identifyTopic(query: string, imageAnalysis?: string): Promise<string> {
    const categories = [
      "watering", "nutrients", "flushing", "pest-control", "cloning",
      "seed-propagation", "drying", "curing", "environment",
    ];

    const topicPrompt = `Analyze this cannabis cultivation question and choose the single best category for it from the following list: ${categories.join(", ")}.

User Question: "${query}"
${imageAnalysis ? `Image Analysis: ${imageAnalysis}` : ""}

IMPORTANT: Only categorize if this is clearly about cannabis cultivation. If it's about other plants or non-cannabis topics, respond with "general".

Choose the single best category that matches the user's cannabis question. Respond with ONLY the category name.`;

    const response = await this.model.invoke([
      new SystemMessage(topicPrompt),
      new HumanMessage(query || "Please analyze this content")
    ]);
    
    const category = (response.content as string).trim().toLowerCase();
    return categories.includes(category) ? category : "general";
  }

  private async isUserAnsweringPreviousQuestion(
    chatHistory: ChatMessage[],
    query: string
  ): Promise<boolean> {
    if (!chatHistory || chatHistory.length < 2) {
      return false;
    }

    const lastAiMessage = chatHistory.filter((m) => m.role === "assistant").pop();
    if (!lastAiMessage || !lastAiMessage.content) {
      return false;
    }

    // Check if we're in diagnostic mode - this takes priority
    const isInDiagnosticMode = 
      lastAiMessage.metadata?.category === "diagnostic_questions" ||
      lastAiMessage.metadata?.step === "diagnostic_questions";

    if (isInDiagnosticMode) {
      return false; // Let diagnostic service handle this
    }

    // Check if the last AI message was a question
    const lowerLastAiMessage = lastAiMessage.content.toLowerCase();
    const questionIndicators = [
      "?", "tell me", "what are", "how do you", "what is", "which product",
      "watering schedule", "current readings", "recent feedings",
    ];
    
    const isLastAiMessageAQuestion = questionIndicators.some((indicator) =>
      lowerLastAiMessage.includes(indicator)
    );

    if (!isLastAiMessageAQuestion) {
      return false;
    }

    const lowerQuery = query.toLowerCase();
    const answerKeywords = [
      "i use", "i have", "i water", "i feed", "yes", "no", "about", "every",
      "twice", "once", "days ago", "weeks ago", "yesterday", "today", "recently",
      "ph", "ppm", "ec", "ml", "tsp", "tbsp", "gal", "not sure", "maybe",
      "around", "approximately", "kinda", "sorta", "half", "full", "little",
      "lot", "much", "often", "sometimes", "usually", "always", "never",
      "fox farm", "big bloom", "grow big", "tiger bloom", "week", "stage",
      "vegetative", "flowering", "veg", "flower", "degrees", "humidity",
      "inches", "feet", "cm", "meters", "lights", "led", "hps", "cfl"
    ];

    const containsAnswerKeyword = answerKeywords.some((keyword) =>
      lowerQuery.includes(keyword)
    );

    // More generous detection for short responses that could be answers
    const isShortResponse = lowerQuery.length < 150;
    const isNotNewQuestion = !lowerQuery.includes("?") && 
      !lowerQuery.startsWith("how") && 
      !lowerQuery.startsWith("what") && 
      !lowerQuery.startsWith("why") && 
      !lowerQuery.startsWith("when") && 
      !lowerQuery.startsWith("where");

    return containsAnswerKeyword || (isShortResponse && isNotNewQuestion);
  }

  private async getProtocolForCategory(category: string): Promise<string> {
    try {
      const protocols = await this.databaseService.searchProtocols(category, category, 1);

      if (protocols.length > 0) {
        return protocols[0].pageContent || protocols[0].content || "Protocol not available";
      }

      return "Protocol not available - using general QPG guidelines";
    } catch (error) {
      logger.error(`Error retrieving protocol for ${category}:`, error);
      return "Protocol retrieval failed - using general QPG guidelines";
    }
  }

  private async getCultivationContext(userId: string): Promise<string> {
    try {
      const session = await this.databaseService.getUserSession(userId);
      if (!session?.messages) {
        return "";
      }

      const cultivationMessage = session.messages.find(
        (m: any) => m.role === "system" && m.content?.includes("CULTIVATION_INFO:")
      );

      if (cultivationMessage?.metadata) {
        const stage = cultivationMessage.metadata.stage;
        const week = cultivationMessage.metadata.week;
        const day = cultivationMessage.metadata.day;
        
        let context = "\n**CULTIVATION DETAILS:**\n";
        
        if (stage) {
          context += `- Stage: ${stage}\n`;
        }
        
        // For flowering stage, prioritize day number over week
        if (stage?.includes('flowering')) {
          if (day !== undefined) {
            context += `- Day: ${day}\n`;
          } else if (week !== undefined) {
            context += `- Week: ${week}\n`;
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

      return "";
    } catch (error) {
      logger.error("Error getting cultivation context:", error);
      return "";
    }
  }

  private async getNutritionInfo(query: string, cultivationContext: string): Promise<string> {
    try {
      // Check if this is a feeding/nutrition question
      const lowerQuery = query.toLowerCase();
      const nutritionKeywords = ['feed', 'feeding', 'nutrient', 'nutrition', 'fertilizer', 'day', 'week', 'fox farm'];
      const isNutritionQuery = nutritionKeywords.some(keyword => lowerQuery.includes(keyword));
      
      if (!isNutritionQuery) {
        return "";
      }

      // Extract timing info from query and cultivation context
      const { stage, week, day } = this.extractTimingFromQuery(query, cultivationContext);
      
      if (!stage && !week && !day) {
        return "";
      }

      // Generate specific nutrition guidance based on timing
      return this.generateNutritionGuidance(stage, week, day);
    } catch (error) {
      logger.error("Error getting nutrition info:", error);
      return "";
    }
  }

  private extractTimingFromQuery(query: string, cultivationContext: string): { stage?: string; week?: number; day?: number } {
    const lowerQuery = query.toLowerCase();
    let stage: string | undefined;
    let week: number | undefined;
    let day: number | undefined;

    // Extract stage from query
    if (lowerQuery.includes('flowering') || lowerQuery.includes('flower') || lowerQuery.includes('bloom')) {
      stage = 'flowering';
    } else if (lowerQuery.includes('vegetative') || lowerQuery.includes('veg')) {
      stage = 'vegetative';
    } else if (lowerQuery.includes('seedling')) {
      stage = 'seedling';
    }

    // Extract week number
    const weekMatches = query.match(/week\s*(\d+)|\b(\d+)\s*week/i);
    if (weekMatches) {
      const weekNum = parseInt(weekMatches[1] || weekMatches[2]);
      if (weekNum >= 1 && weekNum <= 20) {
        week = weekNum;
      }
    }

    // Extract day number
    const dayMatches = query.match(/day\s*(\d+)|\b(\d+)\s*day/i);
    if (dayMatches) {
      const dayNum = parseInt(dayMatches[1] || dayMatches[2]);
      if (dayNum >= 1 && dayNum <= 84) {
        day = dayNum;
      }
    }

    // Try to extract from cultivation context if not found in query
    if (!stage || (!week && !day)) {
      const contextStage = cultivationContext.match(/Stage:\s*(\w+)/i)?.[1]?.toLowerCase();
      const contextWeek = cultivationContext.match(/Week:\s*(\d+)/i)?.[1];
      const contextDay = cultivationContext.match(/Day:\s*(\d+)/i)?.[1];
      
      if (!stage && contextStage) {
        stage = contextStage;
      }
      if (!week && contextWeek) {
        week = parseInt(contextWeek);
      }
      if (!day && contextDay) {
        day = parseInt(contextDay);
      }
    }

    logger.info(`🌱 Extracted timing: stage=${stage}, week=${week}, day=${day}`);
    return { stage, week, day };
  }

  private generateNutritionGuidance(stage?: string, week?: number, day?: number): string {
    if (!stage) return "";
    
    let guidance = '\n**SPECIFIC NUTRITION GUIDANCE FOR YOUR PLANT:**\n';
    
    if (stage === 'vegetative' && week !== undefined) {
      switch (week) {
        case 1:
          guidance += 'Week 1 (Veg): Big Bloom®: 6 tsp per gallon\n';
          guidance += 'Mix with water and feed every other watering.';
          break;
        case 2:
          guidance += 'Week 2 (Veg): Big Bloom®: 6 tsp, Grow Big®: 1 tsp, Botanicare Cal-Mag Plus: 1 tsp per gallon\n';
          guidance += 'Mix nutrients one at a time into water, never mix concentrates directly.';
          break;
        case 3:
          guidance += 'Week 3 (Veg): Big Bloom®: 6 tsp, Grow Big®: 1.5 tsp, Botanicare Cal-Mag Plus: 1 tsp per gallon\n';
          guidance += 'Continue feeding every other watering with pH 6.0-6.5.';
          break;
        case 4:
          guidance += 'Week 4 (Veg): Big Bloom®: 6 tsp, Grow Big®: 1.5 tsp, Botanicare Cal-Mag Plus: 1 tsp, Open Sesame®: 1/4 tsp per gallon\n';
          guidance += '**CRITICAL: Flush with Sledgehammer® (2 tsp/gal) at end of this week before switching to flower!**';
          break;
        default:
          guidance += `Week ${week} (Veg): Follow Week 4 protocol if beyond Week 4`;
      }
    } else if (stage === 'flowering' && day !== undefined) {
      if (day >= 1 && day <= 7) {
        guidance += 'Day 1–7 (Flower): Big Bloom®: 3 tsp, Tiger Bloom®: 1 tsp, Grow Big®: 1.5 tsp, Open Sesame®: 1/4 tsp, Botanicare Cal-Mag Plus: 1 tsp, Botanicare Liquid Karma: 2 tsp, Botanicare Sweet: 2 tsp per gallon';
      } else if (day >= 8 && day <= 14) {
        guidance += 'Day 8–14 (Flower): Big Bloom®: 3 tsp, Tiger Bloom®: 1 tsp, Grow Big®: 1.5 tsp, Open Sesame®: 1/4 tsp, Botanicare Cal-Mag Plus: 1 tsp, Botanicare Liquid Karma: 2 tsp, Botanicare Sweet: 2 tsp per gallon';
      } else if (day >= 15 && day <= 21) {
        guidance += 'Day 15–21 (Flower): Big Bloom®: 3 tsp, Tiger Bloom®: 1 tsp, Beastie Bloomz®: 1/4 tsp, Botanicare Cal-Mag Plus: 1 tsp, Botanicare Liquid Karma: 2 tsp, Botanicare Sweet: 2 tsp per gallon\n';
        guidance += '**IMPORTANT: Flush with Sledgehammer® (2 tsp/gallon) at end of this week (Day 21)!**';
      } else if (day >= 22 && day <= 28) {
        guidance += 'Day 22–28 (Flower): Big Bloom®: 3 tsp, Tiger Bloom®: 2 tsp, Beastie Bloomz®: 1/4 tsp, Botanicare Cal-Mag Plus: 1 tsp, Botanicare Liquid Karma: 2 tsp, Botanicare Sweet: 2 tsp per gallon';
      } else if (day >= 29 && day <= 35) {
        guidance += 'Day 29–35 (Flower): Big Bloom®: 3 tsp, Tiger Bloom®: 2 tsp, Cha Ching®: 1/4 tsp, Botanicare Cal-Mag Plus: 1 tsp, Botanicare Liquid Karma: 2 tsp, Botanicare Sweet: 2 tsp per gallon';
      } else if (day >= 36 && day <= 42) {
        guidance += 'Day 36–42 (Flower): Big Bloom®: 3 tsp, Tiger Bloom®: 2 tsp, Cha Ching®: 1/4 tsp, Botanicare Cal-Mag Plus: 1 tsp, Botanicare Liquid Karma: 2 tsp, Botanicare Sweet: 2 tsp per gallon\n';
        guidance += '**IMPORTANT: Flush with Sledgehammer® (2 tsp/gallon) at end of this week (Day 42)!**';
      } else if (day >= 43 && day <= 49) {
        guidance += 'Day 43–49 (Flower): Big Bloom®: 3 tsp, Tiger Bloom®: 1 tsp, Cha Ching®: 1/4 tsp, Botanicare Cal-Mag Plus: 1 tsp, Botanicare Liquid Karma: 2 tsp, Botanicare Sweet: 2 tsp per gallon';
      } else if (day >= 50) {
        guidance += 'Day 50+ (Flower): Big Bloom®: 3 tsp per gallon. If extended, continue Big Bloom®: 3 tsp.';
      }
    } else if (stage === 'seedling') {
      guidance += 'Week 0 (Seedling/Cutting): Big Bloom®: 6 tsp per gallon\n';
      guidance += 'Wait until plant has 2-3 sets of true leaves before starting Week 1 vegetative feeding.';
    }
    
    guidance += '\n\n**FEEDING PROTOCOL:**\n';
    guidance += '- Feed every other watering (Feed-Water-Feed cycle)\n';
    guidance += '- Always pH balance to 6.0-6.5 for soil\n';
    guidance += '- Water until 10-20% runoff\n';
    guidance += '- Add nutrients to water one at a time, never mix concentrates\n';
    guidance += '- Never skip Cal-Mag Plus with RO water';
    
    return guidance;
  }
}