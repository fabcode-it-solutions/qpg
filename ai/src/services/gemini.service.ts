import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { config } from "../config";
import { logger } from "../utils/logger";
import { ChatMessage, ConversationContext, AIResponse } from "../types";

export class GeminiService {
  private model: ChatGoogleGenerativeAI;
  private visionModel: ChatGoogleGenerativeAI;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: config.ai.googleApiKey,
      modelName: config.ai.model,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    this.visionModel = new ChatGoogleGenerativeAI({
      apiKey: config.ai.googleApiKey,
      modelName: config.ai.visionModel,
      temperature: 0.4, // Lower temperature for more factual, objective analysis
      maxOutputTokens: 2048,
    });
  }

  async generateResponse(
    context: ConversationContext,
    userMessage: string,
    relevantProtocols: any[] = []
  ): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(context, relevantProtocols);
      const messages = this.buildMessageHistory(
        context.messageHistory,
        systemPrompt,
        userMessage
      );

      const response = await this.model.invoke(messages);

      const aiResponse: AIResponse = {
        content: response.content as string,
        confidence: 0.85, // Default confidence
        sources: relevantProtocols
          .map((p) => p.metadata?.title)
          .filter(Boolean),
        followUpQuestions: this.generateFollowUpQuestions(
          userMessage,
          response.content as string
        ),
      };

      logger.debug(`Generated AI response for user ${context.userId}`);
      return aiResponse;
    } catch (error) {
      logger.error("Failed to generate AI response:", error);
      throw error;
    }
  }

  async analyzeImage(
    base64Image: string,
    mimeType: string,
    prompt: string
  ): Promise<string> {
    try {
      logger.info(`Analyzing image with prompt: "${prompt}"`);

      // First, validate if the image contains a cannabis plant
      const validationResult = await this.validateCannabisImage(
        base64Image,
        mimeType
      );
      if (!validationResult.isCannabis) {
        return `NOT_CANNABIS_PLANT: ${validationResult.actualContent}`;
      }

      const systemPrompt = `You are a specialized cannabis cultivation expert. Analyze the provided cannabis plant image objectively and describe exactly what you see without bias toward any particular issue type.

WHAT TO LOOK FOR AND DESCRIBE:
- Leaf condition: colors, patterns, spots, discoloration, texture changes
- Growth patterns: normal, stunted, twisted, deformed growth
- Damage location: which parts of plant are affected
- Visible signs: any insects, webbing, eggs, or movement
- Environmental indicators: burning, bleaching, wilting, drooping
- Severity: extent and progression of any issues observed

ANALYSIS APPROACH:
- Describe symptoms objectively without jumping to conclusions
- If you see insects, webbing, or egg clusters - clearly state this
- If you see yellowing, spots, or discoloration - describe the pattern and location
- If you see wilting, burning, or other damage - describe what's visible
- Be specific about what is definitely visible vs what might be possible

FORMAT YOUR RESPONSE AS:
1. VISUAL OBSERVATIONS: [Detailed description of what you can see in the image]
2. SYMPTOM PATTERNS: [Any patterns in the damage or symptoms observed]
3. DEFINITIVE SIGNS: [Any clear indicators of specific issues you can confidently identify]
4. CONFIDENCE: [High/Medium/Low based on image quality and visibility of symptoms]

Be objective and descriptive. Let the symptoms speak for themselves rather than assuming causes.`;

      const imagePart = {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Image}`,
        },
      };

      const textPart = {
        type: "text",
        text: prompt,
      };

      // LangChain's HumanMessage can accept a mix of content types
      const message = new HumanMessage({
        content: [imagePart, textPart],
      });

      const response = await this.visionModel.invoke([
        new SystemMessage(systemPrompt),
        message,
      ]);

      const analysis = response.content as string;
      logger.debug(`Image analysis result: ${analysis.substring(0, 100)}...`);
      return analysis;
    } catch (error) {
      logger.error("Failed to analyze image:", error);
      // Return a user-friendly error message that can be passed along the chain
      return "I was unable to analyze the image due to a technical issue.";
    }
  }

  async validateCannabisImage(
    base64Image: string,
    mimeType: string
  ): Promise<{
    isCannabis: boolean;
    actualContent: string;
    confidence: number;
  }> {
    try {
      logger.info(`Validating if image contains cannabis plant`);

      const systemPrompt = `You are a plant identification expert. Look at this image and determine what you see.

Analyze the image and respond with a JSON object in this format:
{
  "isCannabis": true/false,
  "actualContent": "brief description of what you see",
  "confidence": 0.0-1.0
}

Guidelines:
- If you see a cannabis/marijuana plant (any growth stage, even if unhealthy): isCannabis = true
- If you see a clearly different plant species (tomato, lettuce, houseplant, etc.): isCannabis = false
- If you see clearly non-plant content (people, objects, landscapes): isCannabis = false
- If the image is very unclear: be conservative, isCannabis = false
- Look for cannabis characteristics: serrated leaves, palmate structure, distinctive growth pattern

Be accurate - only say isCannabis = true if you can reasonably identify cannabis characteristics. When in doubt about plant species, err on the side of isCannabis = false.`;

      const imagePart = {
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${base64Image}`,
        },
      };

      const message = new HumanMessage({
        content: [
          imagePart,
          {
            type: "text",
            text: "What do you see in this image? Respond with JSON.",
          },
        ],
      });

      const response = await this.visionModel.invoke([
        new SystemMessage(systemPrompt),
        message,
      ]);

      let result;
      try {
        // Try to parse JSON response
        const responseText = response.content as string;
        const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, be conservative and reject
          logger.warn(
            "No JSON found in validation response, being conservative"
          );
          return {
            isCannabis: false,
            actualContent: "image validation uncertain",
            confidence: 0.0,
          };
        }
      } catch (parseError) {
        logger.warn("Failed to parse validation JSON, being conservative");
        return {
          isCannabis: false,
          actualContent: "image validation parsing failed",
          confidence: 0.0,
        };
      }

      logger.info(
        `Cannabis validation result: isCannabis=${result.isCannabis}, confidence=${result.confidence}, content=${result.actualContent}`
      );

      return result;
    } catch (error) {
      logger.error("Failed to validate cannabis image:", error);
      // If validation completely fails, be conservative and reject to avoid false positives
      return {
        isCannabis: false,
        actualContent: "image validation failed",
        confidence: 0.0,
      };
    }
  }

  async generateCategorization(prompt: string): Promise<string> {
    try {
      const response = await this.model.invoke([
        { role: "user", content: prompt },
      ]);
      return response.content as string;
    } catch (error) {
      logger.error("Failed to generate categorization:", error);
      throw error;
    }
  }

  async moderateContent(
    content: string,
    type: "post" | "comment" = "post"
  ): Promise<{
    action: "approve" | "reject" | "review";
    reason: string;
    confidence: number;
  }> {
    try {
      const moderationPrompt = `
You are a content moderator for a plant cultivation community. Analyze the following ${type} and determine if it should be approved, rejected, or needs review.

Community Guidelines:
- Must be related to plant cultivation, growing, or gardening
- No spam, promotional content, or off-topic discussions
- No harmful, offensive, or inappropriate content
- No requests for illegal substances or activities
- Constructive questions and discussions are encouraged

Content to moderate: "${content}"

Respond with a JSON object containing:
- action: "approve", "reject", or "review"
- reason: Brief explanation for the decision
- confidence: Number between 0 and 1 indicating confidence in the decision

Example: {"action": "approve", "reason": "Plant cultivation question", "confidence": 0.9}
`;

      const response = await this.model.invoke([
        new SystemMessage(moderationPrompt),
      ]);
      const result = JSON.parse(response.content as string);

      logger.debug(`Moderated ${type} content with action: ${result.action}`);
      return result;
    } catch (error) {
      logger.error("Failed to moderate content:", error);
      return { action: "review", reason: "Moderation error", confidence: 0.0 };
    }
  }

  private buildSystemPrompt(
    context: ConversationContext,
    relevantProtocols: any[]
  ): string {
    const protocolsText =
      relevantProtocols.length > 0
        ? `\n\nRelevant Cultivation Protocols:\n${relevantProtocols
            .map((p) => p.pageContent)
            .join("\n\n")}`
        : "";

    return `You are Q, an expert AI assistant specializing in plant cultivation using the QPG Method. You have extensive knowledge of cultivation protocols and provide helpful, accurate advice to growers.

User Profile:
- Name: ${context.userProfile.name}
- Membership: ${context.userProfile.membershipLevel}
- Member since: ${context.userProfile.createdAt ? context.userProfile.createdAt.toDateString() : 'Unknown'}

Core QPG Method Protocols:
1. Watering: "Wet-dry cycle" methodology - drench until runoff, then allow to dry almost completely
2. Nutrients: Fox Farm regimen (Grow Big, Big Bloom, Tiger Bloom) with bloom boosters and Cal-Mag Plus
3. Flushing: Timed schedule using Fox Farm Sledgehammer at specific intervals
4. Transplanting: Two-step "potting up" with mycorrhizal inoculant
5. Environment: 60/60 Rule for drying/curing, specific temp/humidity parameters
6. Lighting: 50 watts actual power draw per square foot
7. Pest Management: 3-treatment sulfur-based protocol for broad mites

Guidelines:
- Always ask clarifying questions for pest issues to differentiate between thrip and broad mite damage
- Provide specific, actionable advice based on QPG protocols
- Reference relevant protocols when applicable
- Be conversational but professional
- If unsure, ask for more details rather than guessing${protocolsText}`;
  }

  private buildMessageHistory(
    messages: ChatMessage[],
    systemPrompt: string,
    currentMessage: string
  ): any[] {
    const messageHistory = [new SystemMessage(systemPrompt)];

    // Add recent conversation history (last 10 messages)
    const recentMessages = messages.slice(-10);
    for (const msg of recentMessages) {
      if (msg.role === "user") {
        messageHistory.push(new HumanMessage(msg.content));
      } else {
        messageHistory.push(new AIMessage(msg.content));
      }
    }

    messageHistory.push(new HumanMessage(currentMessage));
    return messageHistory;
  }

  private generateFollowUpQuestions(
    userMessage: string,
    aiResponse: string
  ): string[] {
    // Simple heuristic-based follow-up question generation
    const questions: string[] = [];

    if (
      userMessage.toLowerCase().includes("pest") ||
      userMessage.toLowerCase().includes("bug")
    ) {
      questions.push(
        "Can you describe the damage you're seeing in more detail?"
      );
      questions.push("What stage of growth is your plant in?");
    }

    if (
      userMessage.toLowerCase().includes("nutrient") ||
      userMessage.toLowerCase().includes("feeding")
    ) {
      questions.push("What's your current feeding schedule?");
      questions.push("Are you seeing any specific deficiency symptoms?");
    }

    if (userMessage.toLowerCase().includes("water")) {
      questions.push("How are you checking soil moisture?");
      questions.push("What's your current watering frequency?");
    }

    return questions.slice(0, 2); // Return max 2 follow-up questions
  }
}
