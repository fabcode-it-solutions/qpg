import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { config } from "../../config";
import { logger } from "../../utils/logger";

export class DiagnosticTriageService {
  private model: ChatGoogleGenerativeAI;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: config.ai.googleApiKey,
      modelName: config.ai.model,
      temperature: 0.2,
    });
  }

  async analyzeIssueType(
    query: string,
    imageAnalysis?: string
  ): Promise<string> {
    try {
      const triagePrompt = `You are a cannabis cultivation expert using the QPG method. Analyze this user query and determine the PRIMARY issue type.

User Query: "${query}"
${imageAnalysis ? `Image Analysis: ${imageAnalysis}` : ""}

**CLASSIFICATION RULES:**
- **healthy**: Plant looks good, user asking "how does it look", "is it healthy", no problems described
- **pest**: Mentions bugs, mites, webbing, stippling, moving dots, insect damage
- **watering**: Crispy leaves, drooping, wilting, dry soil, overwatering, underwatering, wet-dry cycle
- **nutrient**: Yellowing, brown tips, feeding schedule, Fox Farm products, deficiency, burn
- **environment**: Temperature, humidity, light burn, heat stress, stretching

**IMPORTANT RULES:**
1. If plant appears healthy in image/query, respond "healthy"
2. If pest-related symptoms, respond "pest" 
3. For other plant problems, choose the MOST LIKELY primary cause
4. Default to "general" for general plant problems

Respond with ONLY the issue type: healthy, pest, watering, nutrient, environment or general`;

      const response = await this.model.invoke([
        new SystemMessage(triagePrompt),
        new HumanMessage(
          query || "Please analyze this image for any plant issues"
        ),
      ]);

      const issueType = (response.content as string).trim().toLowerCase();
      return [
        "healthy",
        "pest",
        "watering",
        "nutrient",
        "environment",
      ].includes(issueType)
        ? issueType
        : "general"; // Default fallback
    } catch (error) {
      logger.error("AI triage analysis failed:", error);
      return "general"; // Safe default
    }
  }
}
