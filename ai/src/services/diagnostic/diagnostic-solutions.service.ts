import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { DatabaseService } from "../database.service";
import { config } from "../../config";
import { logger } from "../../utils/logger";
import { User } from "../../types";

export class DiagnosticSolutionsService {
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

  async generateSolution(
    userId: string,
    userAnswers: string,
    issueType: string,
    conversationContext: string,
    cultivationContext?: string,
    stage?: string,
    week?: number,
    day?: number
  ): Promise<{ response: string; metadata: any }> {
    const protocol = await this.getProtocolForIssueType(issueType);
    const timingContext = this.getTimingContext(stage, week, day);
    const nutritionGuidance = issueType === 'nutrient' ? this.getNutritionGuidance(stage, week, day) : '';

    const solutionPrompt = `You are a cannabis cultivation expert providing the final diagnosis and solution using the QPG method.

**CONVERSATION CONTEXT:**
${conversationContext}

**USER'S LATEST ANSWERS:** "${userAnswers}"

**PLANT TIMING CONTEXT:**
${timingContext}

**QPG PROTOCOL FOR ${issueType.toUpperCase()}:**
${protocol}

${nutritionGuidance}

${cultivationContext || ""}

**YOUR TASK:**
Provide a clear, actionable solution following this format:

1. **DIAGNOSIS:** Based on the answers, identify the specific deviation from QPG protocol
2. **IMMEDIATE SOLUTION:** Step-by-step instructions to fix the issue
3. **QPG METHOD:** How this solution aligns with QPG protocols
4. **MONITORING:** What to watch for to confirm improvement

**CRITICAL REQUIREMENTS FOR NUTRITION ISSUES:**
- If this is a nutrition issue, provide the EXACT nutrient recipe for their current stage/timing
- Include specific product names, measurements, and mixing instructions
- Mention upcoming flush requirements if applicable (Week 4 veg, Day 21/42 flowering)
- Reference the exact protocol section that applies to their timing

**GENERAL REQUIREMENTS:**
- Be definitive and confident in your diagnosis
- Give specific, actionable steps
- Use QPG method terminology and protocols
- Include timing for expected improvement
- Be encouraging about successful resolution

Focus on getting their plant back on track with proven QPG methods.`;

    const response = await this.model.invoke([
      new SystemMessage(solutionPrompt),
      new HumanMessage(userAnswers || "Please provide the solution based on the context"),
    ]);

    return {
      response: response.content as string,
      metadata: {
        userId,
        step: "solution_provided",
        issueType,
        category: "diagnostic_solution",
        processedAt: new Date().toISOString(),
        workflow: "simplified_diagnostic",
        stage,
        week,
        day,
      },
    };
  }

  async generateHealthyResponse(
    query: string,
    imageAnalysis?: string
  ): Promise<{ response: string; metadata: any }> {
    try {
      const healthyPrompt = `The user has a healthy cannabis plant and is asking for confirmation or general care advice.

User Query: "${query}"
${imageAnalysis ? `Image Analysis: ${imageAnalysis}` : ""}

Provide positive feedback confirming the plant looks healthy, and give brief maintenance tips to keep it thriving using QPG methods.`;

      const response = await this.model.invoke([
        new SystemMessage(healthyPrompt),
        new HumanMessage(query || "Please analyze this plant image")
      ]);

      return {
        response: response.content as string,
        metadata: {
          category: "healthy_plant",
          agent_used: "healthy",
          processedAt: new Date().toISOString(),
          workflow: "healthy_confirmation",
        },
      };
    } catch (error) {
      logger.error("Failed to generate healthy response:", error);
      return {
        response: "Your plant looks healthy! Keep following the QPG method with proper watering, nutrition, and environmental control to maintain its health.",
        metadata: {
          category: "healthy_plant",
          agent_used: "healthy",
          processedAt: new Date().toISOString(),
          workflow: "healthy_confirmation",
          error: "ai_generation_failed",
        },
      };
    }
  }

  async generatePestResponse(
    query: string,
    imageAnalysis?: string,
    stage?: string
  ): Promise<{ response: string; metadata: any }> {
    try {
      const protocol = await this.getProtocolForCategory("pest-control");

      if (!protocol || protocol.includes("Protocol not available")) {
        throw new Error("No pest control protocol found");
      }

      const effectiveQuery = query && query.trim() !== "" 
        ? query 
        : (imageAnalysis ? "Please analyze this pest issue and provide treatment guidance" : "Please help me treat this pest issue");

      const pestPrompt = `You are a cannabis cultivation expert using the QPG method. The user has a pest issue that needs treatment guidance.

User Query: "${effectiveQuery}"
${imageAnalysis ? `Image Analysis: ${imageAnalysis}` : ""}
${stage ? `Plant Stage: ${stage}` : ""}

**QPG PEST CONTROL PROTOCOL:**
${protocol}

**INSTRUCTIONS:**
- First, check if the QPG protocol above covers the specific pest issue identified
- If the protocol matches the pest type, use the exact steps, timing, and products from the protocol
- If the protocol doesn't cover this specific pest, provide treatment guidance using QPG principles:
  * Maintain QPG cultivation standards
  * Consider plant stage for treatment safety
  * Use organic/natural treatments when possible
  * Focus on prevention and environmental controls
- Always be specific with timing, application methods, and monitoring steps
- Maintain the QPG approach to cannabis cultivation

Provide comprehensive pest treatment guidance based on QPG methods.`;

      const response = await this.model.invoke([
        new SystemMessage(pestPrompt),
        new HumanMessage(effectiveQuery)
      ]);

      const responseContent = response.content as string;
      
      if (!responseContent || responseContent.trim().length < 50) {
        throw new Error("AI response too short or empty");
      }

      return {
        response: responseContent,
        metadata: {
          category: "pest_treatment",
          agent_used: "pest",
          processedAt: new Date().toISOString(),
          workflow: "direct_pest_treatment",
        },
      };
    } catch (error) {
      logger.error("Failed to generate pest response:", error);
      
      const protocol = await this.getProtocolForCategory("pest-control");
      if (protocol && !protocol.includes("Protocol not available")) {
        return {
          response: `**QPG PEST CONTROL PROTOCOL:**\n\n${protocol}`,
          metadata: {
            category: "pest_treatment",
            agent_used: "pest",
            processedAt: new Date().toISOString(),
            workflow: "direct_pest_treatment",
            fallback: "raw_protocol",
          },
        };
      }
      
      return {
        response: "I apologize, but I'm unable to retrieve the specific QPG pest control protocol right now. Please contact support for immediate pest treatment guidance.",
        metadata: {
          category: "pest_treatment",
          agent_used: "pest",
          processedAt: new Date().toISOString(),
          workflow: "direct_pest_treatment",
          error: "protocol_unavailable",
        },
      };
    }
  }

  private async getProtocolForIssueType(issueType: string): Promise<string> {
    const categoryMap: { [key: string]: string } = {
      watering: "watering",
      nutrient: "nutrients",
      environment: "environment",
      pest: "pest-control",
    };

    const category = categoryMap[issueType] || "general";
    return await this.getProtocolForCategory(category);
  }

  private async getProtocolForCategory(category: string): Promise<string> {
    try {
      const protocols = await this.databaseService.searchProtocols(
        category,
        category,
        1
      );

      if (protocols.length > 0) {
        return (
          protocols[0].pageContent ||
          protocols[0].content ||
          "Protocol not available"
        );
      }

      return "Protocol not available - using general QPG guidelines";
    } catch (error) {
      logger.error(`Error retrieving protocol for ${category}:`, error);
      return "Protocol retrieval failed - using general QPG guidelines";
    }
  }

  private getTimingContext(stage?: string, week?: number, day?: number): string {
    if (!stage) return "Plant timing not specified";
    
    if (stage === 'flowering' && day !== undefined) {
      return `Plant is in FLOWERING stage, Day ${day} of flower cycle`;
    } else if (week !== undefined) {
      return `Plant is in ${stage.toUpperCase()} stage, Week ${week}`;
    } else {
      return `Plant is in ${stage.toUpperCase()} stage, timing not specified`;
    }
  }

  private getNutritionGuidance(stage?: string, week?: number, day?: number): string {
    if (!stage) return '';
    
    let guidance = '\n**SPECIFIC NUTRITION GUIDANCE FOR CURRENT TIMING:**\n';
    
    if (stage === 'vegetative' && week !== undefined) {
      switch (week) {
        case 1:
          guidance += 'Week 1 (Veg): Big Bloom®: 6 tsp per gallon';
          break;
        case 2:
          guidance += 'Week 2 (Veg): Big Bloom®: 6 tsp, Grow Big®: 1 tsp, Botanicare Cal-Mag Plus: 1 tsp per gallon';
          break;
        case 3:
          guidance += 'Week 3 (Veg): Big Bloom®: 6 tsp, Grow Big®: 1.5 tsp, Botanicare Cal-Mag Plus: 1 tsp per gallon';
          break;
        case 4:
          guidance += 'Week 4 (Veg): Big Bloom®: 6 tsp, Grow Big®: 1.5 tsp, Botanicare Cal-Mag Plus: 1 tsp, Open Sesame®: 1/4 tsp per gallon\n**IMPORTANT: Flush with Sledgehammer® (2 tsp/gal) at end of this week before transitioning to flower!**';
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
        guidance += 'Day 15–21 (Flower): Big Bloom®: 3 tsp, Tiger Bloom®: 1 tsp, Beastie Bloomz®: 1/4 tsp, Botanicare Cal-Mag Plus: 1 tsp, Botanicare Liquid Karma: 2 tsp, Botanicare Sweet: 2 tsp per gallon\n**IMPORTANT: Flush with Sledgehammer® (2 tsp/gallon) at end of this week (Day 21)!**';
      } else if (day >= 22 && day <= 28) {
        guidance += 'Day 22–28 (Flower): Big Bloom®: 3 tsp, Tiger Bloom®: 2 tsp, Beastie Bloomz®: 1/4 tsp, Botanicare Cal-Mag Plus: 1 tsp, Botanicare Liquid Karma: 2 tsp, Botanicare Sweet: 2 tsp per gallon';
      } else if (day >= 29 && day <= 35) {
        guidance += 'Day 29–35 (Flower): Big Bloom®: 3 tsp, Tiger Bloom®: 2 tsp, Cha Ching®: 1/4 tsp, Botanicare Cal-Mag Plus: 1 tsp, Botanicare Liquid Karma: 2 tsp, Botanicare Sweet: 2 tsp per gallon';
      } else if (day >= 36 && day <= 42) {
        guidance += 'Day 36–42 (Flower): Big Bloom®: 3 tsp, Tiger Bloom®: 2 tsp, Cha Ching®: 1/4 tsp, Botanicare Cal-Mag Plus: 1 tsp, Botanicare Liquid Karma: 2 tsp, Botanicare Sweet: 2 tsp per gallon\n**IMPORTANT: Flush with Sledgehammer® (2 tsp/gallon) at end of this week (Day 42)!**';
      } else if (day >= 43 && day <= 49) {
        guidance += 'Day 43–49 (Flower): Big Bloom®: 3 tsp, Tiger Bloom®: 1 tsp, Cha Ching®: 1/4 tsp, Botanicare Cal-Mag Plus: 1 tsp, Botanicare Liquid Karma: 2 tsp, Botanicare Sweet: 2 tsp per gallon';
      } else if (day >= 50) {
        guidance += 'Day 50+ (Flower): Big Bloom®: 3 tsp per gallon. If extended, continue Big Bloom®: 3 tsp.';
      }
    } else if (stage === 'seedling') {
      guidance += 'Week 0 (Seedling/Cutting): Big Bloom®: 6 tsp per gallon (Wait until plant has 2-3 sets of true leaves before starting Week 1)';
    }
    
    guidance += '\n\n**FEEDING PROTOCOL REMINDER:**\n- Feed every other watering (alternate nutrients and plain water)\n- Always pH balance to 6.0-6.5 for soil\n- Water until 10-20% runoff\n- Never skip Cal-Mag Plus with RO water';
    
    return guidance;
  }
}