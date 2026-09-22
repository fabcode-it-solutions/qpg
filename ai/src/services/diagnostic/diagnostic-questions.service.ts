import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { config } from "../../config";
import { logger } from "../../utils/logger";

export class DiagnosticQuestionsService {
  private model: ChatGoogleGenerativeAI;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      apiKey: config.ai.googleApiKey,
      modelName: config.ai.model,
      temperature: 0.2,
    });
  }

  async generateQuestions(
    userId: string,
    query: string,
    issueType: string,
    imageAnalysis?: string,
    cultivationContext?: string,
    stage?: string,
    week?: number,
    day?: number
  ): Promise<{ response: string; metadata: any }> {
    const questionPrompt = `You are an experienced cannabis grower helping a fellow grower diagnose their plant issue. Be conversational, encouraging, and ask targeted questions.

User Query: "${query}"
${imageAnalysis ? `Image Analysis: ${imageAnalysis}` : ""}
${cultivationContext || ""}

Issue Type Identified: ${issueType.toUpperCase()}

**YOUR TASK:**
Start with "Looking at your plant, I can see signs of ${issueType} issues..." then ask 2-3 targeted questions based on the issue type below:

**${issueType.toUpperCase()} DIAGNOSTIC QUESTIONS:**
${this.getHypothesisQuestions(issueType, stage, week, day)}

**FORMAT:**
- Be conversational and encouraging
- Start by acknowledging what you see
- Ask questions as a numbered list
- End with encouraging note about finding a solution

Be supportive - frame questions as helping to understand their setup, not interrogating them.`;

    const response = await this.model.invoke([
      new SystemMessage(questionPrompt),
      new HumanMessage(query || "Please help me diagnose this plant issue"),
    ]);

    return {
      response: response.content as string,
      metadata: {
        userId,
        step: "diagnostic_questions",
        issueType,
        category: "diagnostic_questions",
        processedAt: new Date().toISOString(),
        workflow: "simplified_diagnostic",
      },
    };
  }

  async isUserAnsweringQuestions(
    lastAiMessage: any,
    query: string
  ): Promise<boolean> {
    if (!lastAiMessage?.metadata) {
      return false;
    }

    const isInDiagnosticMode =
      lastAiMessage.metadata.category === "diagnostic_questions" ||
      lastAiMessage.metadata.step === "diagnostic_questions";

    if (!isInDiagnosticMode) {
      return false;
    }

    try {
      const answerDetectionPrompt = `You are analyzing whether a user's response is answering diagnostic questions about their cannabis plant. Users may not be experts and might give informal, partial, or uncertain answers.

**LAST AI MESSAGE (asking diagnostic questions):**
${lastAiMessage.content}

**USER'S RESPONSE:**
"${query}"

**TASK:**
Determine if the user's response is attempting to answer the diagnostic questions asked in the AI message.

**ANSWER INDICATORS (respond "YES" for these):**
- Providing watering frequency: "once a week", "every 3 days", "when dry"
- Mentioning timing: "4 days ago", "yesterday", "last week", "recently"
- Describing amounts: "a lot", "little bit", "until runoff", "half cup"
- Uncertainty responses: "not sure", "I think", "maybe", "around"
- Product names: "Fox Farm", "Big Bloom", "Grow Big", brand names
- Numbers/measurements: "week 3", "75 degrees", "50%", "18 inches"
- Descriptive answers: "crispy", "yellow", "drooping", "healthy"
- Multiple answers in sequence: "1. yes, 2. no, 3. not sure"
- Casual responses: "yeah", "nope", "kinda", "sorta"

**NEW QUESTION INDICATORS (respond "NO" for these):**
- Asking completely new questions: "How do I...", "What should I...", "Can you tell me..."
- Changing topics entirely: asking about different plant issues
- Requesting general information unrelated to the questions asked

**EXAMPLES:**
- "once in a week, 4 days ago, not sure" = YES (answering watering questions)
- "Fox Farm Grow Big, half strength" = YES (answering nutrient questions)
- "75 degrees, about 50% humidity" = YES (answering environment questions)
- "I water when the soil feels dry" = YES (answering watering method)
- "vegetative week 4" = YES (answering stage/week question)
- "How do I fix yellow leaves?" = NO (new question, not answering)
- "What nutrients should I use?" = NO (new question, not answering)

Be GENEROUS in detecting answers. Users may be beginners and give informal responses. If they're attempting to provide any information related to the questions asked, respond "YES".

Respond with ONLY "YES" or "NO".`;

      const response = await this.model.invoke([
        new SystemMessage(answerDetectionPrompt),
        new HumanMessage("Is the user answering the diagnostic questions?"),
      ]);

      const isAnswering =
        (response.content as string).trim().toUpperCase() === "YES";
      logger.info(
        `🔍 AI-powered answer detection: ${isAnswering} for query: "${query.substring(
          0,
          50
        )}..."`
      );

      return isAnswering;
    } catch (error) {
      logger.error("Failed to detect if user is answering questions:", error);
      return false;
    }
  }

  private getHypothesisQuestions(
    issueType: string,
    stage?: string,
    week?: number,
    day?: number
  ): string {
    const questions: { [key: string]: string[] } = {
      watering: [
        "Tell me about your watering method - are you using the QPG wet-dry cycle? How do you determine when to water?",
        "When did you last water, and how much runoff did you get (if any)?",
        "How do you check soil moisture - finger test, lift test, or moisture meter?",
      ],
      nutrient: [
        // Only ask about cultivation stage/timing if not already provided
        ...(!stage && week === undefined && day === undefined
          ? [
              "What cultivation stage and timing is your plant in? (e.g., 'vegetative week 3' or 'flowering day 15')",
            ]
          : []),
        "What Fox Farm products are you currently using and at what strength?",
      ],
      environment: [
        "What are your current temperature and humidity readings in the grow space?",
        "How far are your lights from the plant tops, and what type of lights?",
        "Do you have air circulation/fans running in the grow area?",
        "Any recent changes to your environment or light schedule?",
      ],
    };

    const questionList = questions[issueType] || questions.watering;
    return questionList.map((q, i) => `${i + 1}. ${q}`).join("\n");
  }
}
