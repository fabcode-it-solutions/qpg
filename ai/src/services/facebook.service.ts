import axios from "axios";
import { config } from "../config";
import { logger } from "../utils/logger";
import { GeminiService } from "./gemini.service";
import { FacebookPost, FacebookComment, ChatMessage } from "../types";

export class FacebookService {
  private geminiService: GeminiService;
  private databaseService: any;
  private conversationTracking: Map<
    string,
    {
      count: number;
      lastReply: Date;
      messageHistory: ChatMessage[];
      postId?: string;
      postContent?: string;
    }
  > = new Map();

  private readonly CONVERSATION_EXPIRY_HOURS = 24;

  constructor(databaseService?: any) {
    this.geminiService = new GeminiService();
    this.databaseService = databaseService;
    setInterval(() => this.cleanupExpiredConversations(), 1000 * 60 * 60);
  }

  async handleWebhook(body: any): Promise<void> {
    try {
      logger.info("Processing Facebook webhook payload", {
        object: body.object,
        entryCount: body.entry?.length || 0,
      });

      if (body.object === "page") {
        for (const entry of body.entry || []) {
          if (entry.changes) {
            for (const change of entry.changes) {
              try {
                await this.processChange(change);
              } catch (error) {
                logger.error("Error processing webhook change:", error);
              }
            }
          }

          if (entry.messaging) {
            for (const messaging of entry.messaging) {
              try {
                await this.processMessaging(messaging);
              } catch (error) {
                logger.error("Error processing messaging event:", error);
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error("Error handling Facebook webhook:", error);
      throw error;
    }
  }

  private async processChange(change: any): Promise<void> {
    const { field, value } = change;

    switch (field) {
      case "feed":
        if (value.item === "post" || value.item === "status") {
          await this.handleNewPost(value);
        } else if (value.item === "comment") {
          await this.handleComment(value);
        }
        break;
      case "comments":
        await this.handleComment(value);
        break;
    }
  }

  private async handleNewPost(postData: any): Promise<void> {
    try {
      const postDetails = await this.getPostDetails(postData.post_id);
      if (!postDetails) return;

      const post: FacebookPost = {
        id: postDetails.id,
        message: postDetails.message || "",
        from: postDetails.from,
        created_time: postDetails.created_time,
        attachments: postDetails.attachments,
      };

      // Skip posts from the page itself
      if (post.from?.id === config.facebook.pageId) {
        return;
      }

      // Apply community guidelines moderation
      const moderation = await this.moderatePostContent(post.message);

      if (moderation.action === "approve") {
        logger.info(`✅ Post ${post.id} approved: ${moderation.reason}`);
      } else if (moderation.action === "reject") {
        await this.hidePost(post.id);
        logger.info(`❌ Post ${post.id} hidden: ${moderation.reason}`);
      } else {
        logger.info(
          `⚠️ Post ${post.id} flagged for review: ${moderation.reason}`
        );
      }
    } catch (error) {
      logger.error("Error handling new post:", error);
    }
  }

  private async handleComment(commentData: any): Promise<void> {
    try {
      logger.debug(`Handling comment webhook data:`, {
        commentId: commentData.comment_id,
        postId: commentData.post_id || commentData.post?.id,
        webhookData: commentData,
      });

      const commentDetails = await this.getCommentDetails(
        commentData.comment_id
      );
      if (!commentDetails) {
        logger.warn(
          `Failed to get comment details for ${commentData.comment_id}`
        );
        return;
      }

      // Use webhook data for 'from' if Graph API doesn't return it (common for replies)
      const fromData = commentDetails.from || commentData.from;
      // Prioritize webhook parent_id as it's more reliable for replies
      const parentId = commentData.parent_id || commentDetails.parent?.id;

      const comment: FacebookComment = {
        id: commentDetails.id,
        message: commentDetails.message || commentData.message || "",
        from: fromData,
        created_time:
          commentDetails.created_time ||
          new Date(commentData.created_time * 1000).toISOString(),
        parent: parentId ? { id: parentId } : undefined,
      };

      const postId = commentData.post_id || commentData.post?.id;

      // Skip comments if user ID is missing
      if (!comment.from?.id) {
        logger.warn(`Skipping comment - missing user ID`, {
          commentId: comment.id,
          fromId: comment.from?.id,
          fromName: comment.from?.name,
          hasFrom: !!comment.from,
          commentData: commentData,
        });
        return;
      }

      logger.debug(`Processing comment from user`, {
        commentId: comment.id,
        userId: comment.from.id,
        userName: comment.from.name,
        hasParent: !!comment.parent,
        parentId: comment.parent?.id,
      });

      // Skip ALL comments from the page itself (both AI and manual admin comments)
      if (comment.from.id === config.facebook.pageId) {
        logger.info(`Skipping page comment (manual admin or AI-generated)`, {
          commentId: comment.id,
          fromId: comment.from.id,
        });
        return;
      }

      // NEW WORKFLOW: Process all user comments with brand ambassador approach
      await this.processUserCommentWithBrandAmbassador(comment, postId);
    } catch (error) {
      logger.error("Error handling comment:", error);
    }
  }

  private async processUserCommentWithBrandAmbassador(
    comment: FacebookComment,
    postId?: string
  ): Promise<void> {
    try {
      // Step 3.1: Event Trigger & Data Collection
      logger.info(`🎯 Processing user comment with brand ambassador workflow`, {
        commentId: comment.id,
        userId: comment.from?.id,
        userName: comment.from?.name,
        postId,
      });

      // Moderate the comment first
      const moderation = await this.moderateCommentContent(comment.message);
      if (moderation.action === "reject") {
        await this.hideComment(comment.id);
        logger.info(`❌ Comment hidden: ${moderation.reason}`, {
          commentId: comment.id,
          userId: comment.from?.id,
        });
        return;
      }

      // Collect the three key pieces of information
      const userComment = comment.message;
      let postContext = "";
      let courseSyllabus = "";

      // Get post context
      if (postId) {
        const originalPost = await this.getPostDetails(postId);
        if (originalPost) {
          postContext = originalPost.message || "";
        }
      }

      // Get course syllabus from database (QPG protocols)
      if (this.databaseService) {
        try {
          const syllabusProtocols = await this.databaseService.searchProtocols(
            "QPG course syllabus overview",
            "course-syllabus",
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

      // Step 3.2 & 3.3: API Call to 'Q' with AI Response Logic
      const aiResponse = await this.generateBrandAmbassadorResponse(
        userComment,
        postContext,
        courseSyllabus
      );

      // Step 3.4: Post the Reply
      if (aiResponse) {
        await this.replyToComment(comment.id, aiResponse);
        logger.info(`🤖 Brand ambassador response posted`, {
          commentId: comment.id,
          userId: comment.from?.id,
          userName: comment.from?.name,
          responseLength: aiResponse.length,
        });
      }
    } catch (error) {
      logger.error("Error in brand ambassador workflow:", error);
      // Fallback response
      const fallbackMessage =
        "Thanks for your interest! For detailed cultivation guidance, check out our comprehensive QPG course. Feel free to reach out with any questions! 🌱";
      await this.replyToComment(comment.id, fallbackMessage);
    }
  }

  private async generateBrandAmbassadorResponse(
    userComment: string,
    postContext: string,
    courseSyllabus: string
  ): Promise<string | null> {
    try {
      const systemPrompt = `You are Q, the AI brand ambassador for QPG (Quantum Pot Grow). Your primary role on this public Facebook platform is to:

1. Act as a brand ambassador and marketing tool
2. Engage potential customers in intelligent discussion
3. Convert followers into paying students
4. NEVER provide specific "how-to-grow" technical support in this public forum

You have access to:
- User's Comment: "${userComment}"
- Post Context: "${postContext}"
- QPG Course Syllabus: ${courseSyllabus}

Response Rules:

Rule 1 - General Discussion: If the user's comment is a general question or statement related to the topic, engage in intelligent, on-topic conversation. Use post context and reinforce QPG brand message (purity, potency, affordability).

Rule 2 - Course-Specific Questions: If the user asks about the course (cost, content, what's taught), use the course syllabus to give precise, helpful answers highlighting the course value.

Rule 3 - "How-to-Grow" Questions (The "Hand-Off"): If the user asks specific technical cultivation questions, perform a "soft hand-off" to promote the course. Example format:
"That's a great question, and getting [specific technique] right is critical for [benefit]. That level of detail is exactly what we cover in [specific module], '[module name].' The video provides a visual, step-by-step guide, and as a member, you'd have access to me in the private Plant Clinic 24/7 to help diagnose your specific plant's needs in real-time."

Keep responses:
- Professional but friendly
- Focused on value proposition
- Under 500 characters for Facebook
- Brand-focused, not technical support
- Must add website course page link "${config.facebook.plantClinicUrl}/courses"

Analyze the user's comment and respond according to the appropriate rule.`;

      const context = {
        userId: "brand-ambassador",
        sessionId: "facebook-brand",
        messageHistory: [],
        userProfile: {
          id: "brand-ambassador",
          name: "Q Brand Ambassador",
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

      // Ensure response fits Facebook limits
      let responseContent = response.content;
      if (responseContent.length > 7500) {
        responseContent =
          responseContent.substring(0, 7400) +
          "... Learn more in our QPG course!";
      }

      // Log response type for analytics (simplified classification)
      let responseType = "general_discussion";
      if (
        responseContent.toLowerCase().includes("module") ||
        responseContent.toLowerCase().includes("course")
      ) {
        responseType = "course_questions";
      } else if (
        responseContent.toLowerCase().includes("that level of detail") ||
        responseContent.toLowerCase().includes("plant clinic")
      ) {
        responseType = "how_to_handoff";
      }

      logger.info(`🎯 Brand ambassador response generated`, {
        responseType,
        userComment: userComment.substring(0, 100),
        responseLength: responseContent.length,
      });

      return responseContent;
    } catch (error) {
      logger.error("Error generating brand ambassador response:", error);
      return null;
    }
  }

  private async moderatePostContent(message: string): Promise<{
    action: "approve" | "reject" | "review";
    reason: string;
  }> {
    try {
      const moderationPrompt = `You are a content moderator for QPG's Facebook page, which is EXCLUSIVELY dedicated to cannabis cultivation.

**CONTEXT UNDERSTANDING:**
Since this is a cannabis-specific page, users posting here are assumed to be asking about cannabis unless they explicitly mention OTHER plants or completely off-topic subjects.

**APPROVAL RULES:**

✅ **APPROVE these types of posts:**
1. **Explicitly mentions cannabis** (cannabis, marijuana, weed, hemp, THC, CBD, strains, buds, etc.)
2. **Cultivation questions WITHOUT plant specification** - assume cannabis:
   - "How to deal with pests?" → APPROVE (user is on cannabis page, asking about cannabis pests)
   - "Best nutrients for plants?" → APPROVE (assume cannabis nutrients)
   - "My plant has yellow leaves" → APPROVE (assume cannabis plant)
   - "How often should I water?" → APPROVE (assume cannabis watering)
   - "What's the best pH level?" → APPROVE (assume for cannabis)
   - "Spider mites problem" → APPROVE (pest issue, assume on cannabis)
   - "Lighting schedule question" → APPROVE (growing question, assume cannabis)
3. **QPG method discussions** (since QPG is for cannabis cultivation)
4. **Growing equipment questions** (tents, lights, filters, fans - assume for cannabis)
5. **Harvest and curing questions** (assume cannabis harvest)

❌ **REJECT these types of posts:**
1. **Explicitly mentions OTHER plants:**
   - "How to grow tomatoes?" → REJECT
   - "My rose has pests" → REJECT  
   - "Vegetable garden tips?" → REJECT
   - "Orchid care" → REJECT
2. **Illegal activities:**
   - Selling/buying drugs
   - "Where to buy weed?" (not cultivation)
   - "Who has stuff for sale?"
3. **Completely off-topic:**
   - Political rants
   - Personal drama
   - Random memes unrelated to growing
   - Recipes (unless cannabis edibles from home-grown)
   - "What's the weather today?"
4. **Spam and harassment:**
   - Promotional spam
   - Repeated irrelevant posts
   - Attacking other users

**KEY PRINCIPLE:**
- If someone is posting on a cannabis cultivation page with a growing/plant question → They mean cannabis (APPROVE)
- Only reject if they CLEARLY mention other plants or are completely off-topic

**POST TO EVALUATE:**
"${message}"

**DECISION LOGIC:**
1. Does this mention OTHER specific plants (tomato, rose, vegetables)? → If YES, REJECT
2. Is this completely off-topic (politics, random chat, spam)? → If YES, REJECT
3. Is this about illegal sales/buying? → If YES, REJECT
4. Is this a growing/cultivation question? → If YES, APPROVE (assume cannabis)
5. When in doubt, APPROVE (users are here for cannabis help)

Respond with ONLY ONE of these exact words: "approve", "reject", or "review"`;

      const response = await this.geminiService.generateResponse(
        {
          userId: "moderator",
          sessionId: "post-moderation",
          messageHistory: [],
          userProfile: {
            id: "moderator",
            name: "Post Moderator",
            email: "",
            membershipLevel: "basic" as const,
            createdAt: new Date(),
            lastActive: new Date(),
          },
          relevantProtocols: [],
        },
        moderationPrompt
      );

      const decision = response.content.toLowerCase().trim();
      let action: "approve" | "reject" | "review" = "review";
      let reason = "Content requires manual review";

      if (decision.includes("approve")) {
        action = "approve";
        reason = "Content is cultivation-related (assumed cannabis context)";
      } else if (decision.includes("reject")) {
        action = "reject";
        reason = "Content violates community guidelines or is off-topic";
      }

      // Smart context-aware checking
      const lowerMessage = message.toLowerCase();

      // Explicit other plants mentioned - should reject
      const otherPlantKeywords = [
        "tomato",
        "tomatoes",
        "vegetable",
        "vegetables",
        "rose",
        "roses",
        "orchid",
        "orchids",
        "basil",
        "mint",
        "parsley",
        "cilantro",
        "lettuce",
        "cucumber",
        "pepper",
        "peppers",
        "lawn",
        "grass",
        "tree",
        "trees",
        "shrub",
        "flower bed",
        "tulip",
        "sunflower",
      ];

      // Clear off-topic indicators
      const offTopicKeywords = [
        "election",
        "politics",
        "president",
        "vote",
        "war",
        "movie",
        "music concert",
        "football game",
        "recipe for cake",
        "car repair",
        "phone service",
        "insurance",
      ];

      // Cannabis/growing context indicators (supportive, not required)
      const growingKeywords = [
        "pest",
        "bug",
        "nutrient",
        "fertilizer",
        "water",
        "light",
        "lighting",
        "soil",
        "ph",
        "ec",
        "ppm",
        "grow",
        "growing",
        "plant",
        "plants",
        "leaf",
        "leaves",
        "root",
        "roots",
        "seed",
        "germination",
        "harvest",
        "flowering",
        "veg",
        "vegetative",
        "clone",
        "cutting",
        "humidity",
        "temperature",
        "tent",
        "fan",
        "filter",
        "carbon",
        "deficiency",
        "yellowing",
        "brown",
        "spots",
        "mold",
        "mildew",
        "training",
        "topping",
        "lst",
        "scrog",
        "cure",
        "curing",
        "trim",
      ];

      const hasOtherPlant = otherPlantKeywords.some((kw) =>
        lowerMessage.includes(kw)
      );
      const hasOffTopic = offTopicKeywords.some((kw) =>
        lowerMessage.includes(kw)
      );
      const hasGrowingContext = growingKeywords.some((kw) =>
        lowerMessage.includes(kw)
      );

      // Override logic: Reject if explicitly about other plants
      if (hasOtherPlant) {
        action = "reject";
        reason = "Content is about non-cannabis plants";
      }

      // Override: Reject if clearly off-topic
      if (hasOffTopic) {
        action = "reject";
        reason = "Content is not related to cultivation";
      }

      // Override: If AI rejected but message has growing context and no other plants mentioned
      // This is likely a cannabis question - approve it
      if (
        action === "reject" &&
        hasGrowingContext &&
        !hasOtherPlant &&
        !hasOffTopic
      ) {
        action = "approve";
        reason =
          "Growing-related question on cannabis page (assumed cannabis context)";
      }

      // Very short messages without context - flag for review
      if (message.trim().split(/\s+/).length < 3 && !hasGrowingContext) {
        action = "review";
        reason = "Message too short to determine context";
      }

      logger.info("Post moderation result:", {
        message: message.substring(0, 100),
        action,
        reason,
        aiDecision: decision,
        hasOtherPlant,
        hasOffTopic,
        hasGrowingContext,
      });

      return { action, reason };
    } catch (error) {
      logger.error("Error in post moderation:", error);
      // Default to approve on errors (benefit of doubt for users)
      return {
        action: "approve",
        reason: "Moderation system error - approved by default",
      };
    }
  }

  private async moderateCommentContent(message: string): Promise<{
    action: "approve" | "reject" | "review";
    reason: string;
  }> {
    try {
      const moderationPrompt = `Moderate this Facebook comment for QPG's page.

**GUIDELINES:**

**ALLOW:**
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

**REJECT:**
- Questions specifically about other plants (tomatoes, apples, roses, etc.) with no cannabis context
- Personal questions about the AI
- Completely unrelated topics (sports, politics, cooking, etc.)
- Inappropriate or offensive content
- Questions about illegal activities beyond cultivation
- Random conversations or small talk

**REVIEW:** 
- Borderline content

**EXAMPLES:**
- "How to grow tomatoes?" = REJECT (specific other plant)
- "How to grow apple tree?" = REJECT (specific other plant)
- "Tomato bugs" = REJECT (specific other plant)
- "How to deal with insects?" = ALLOW (could be cannabis pests)
- "Plant nutrient deficiency" = ALLOW (could be cannabis)
- "Cannabis pest control" = ALLOW
- "Aphids on plants" = ALLOW (could be cannabis pests)

**COMMENT:** "${message}"

Respond with only: "approve", "reject", or "review"`;

      const response = await this.geminiService.generateResponse(
        {
          userId: "moderator",
          sessionId: "comment-moderation",
          messageHistory: [],
          userProfile: {
            id: "moderator",
            name: "Comment Moderator",
            email: "",
            membershipLevel: "basic" as const,
            createdAt: new Date(),
            lastActive: new Date(),
          },
          relevantProtocols: [],
        },
        moderationPrompt
      );

      const decision = response.content.toLowerCase().trim();

      if (decision.includes("approve")) {
        return { action: "approve", reason: "Comment follows guidelines" };
      } else if (decision.includes("reject")) {
        return { action: "reject", reason: "Comment violates guidelines" };
      }

      return { action: "review", reason: "Comment needs manual review" };
    } catch (error) {
      logger.error("Error moderating comment:", error);
      return { action: "review", reason: "Moderation error" };
    }
  }

  private async getPostDetails(postId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${config.facebook.graphUrl}/${postId}`,
        {
          params: {
            fields: "id,message,from,created_time,attachments",
            access_token: config.facebook.pageAccessToken,
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to get post details ${postId}:`);
      return null;
    }
  }

  private async getCommentDetails(commentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${config.facebook.graphUrl}/${commentId}`,
        {
          params: {
            fields: "id,message,from{id,name},created_time,parent{id}",
            access_token: config.facebook.pageAccessToken,
          },
        }
      );
      logger.debug(`Comment details for ${commentId}:`, {
        hasFrom: !!response.data.from,
        fromId: response.data.from?.id,
        fromName: response.data.from?.name,
        hasParent: !!response.data.parent,
        parentId: response.data.parent?.id,
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get comment details ${commentId}:`, error);
      return null;
    }
  }

  private async getComment(commentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${config.facebook.graphUrl}/${commentId}`,
        {
          params: {
            fields: "id,message,from{id,name},created_time",
            access_token: config.facebook.pageAccessToken,
          },
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to get comment ${commentId}:`, error);
      return null;
    }
  }

  private async getPostComments(postId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${config.facebook.graphUrl}/${postId}/comments`,
        {
          params: {
            fields: "id,message,from{id,name},created_time,parent{id}",
            order: "chronological",
            limit: 50,
            access_token: config.facebook.pageAccessToken,
          },
        }
      );
      return response.data.data || [];
    } catch (error) {
      logger.error(`Failed to get comments for post ${postId}:`, error);
      return [];
    }
  }

  private async hidePost(postId: string): Promise<void> {
    try {
      await axios.delete(`${config.facebook.graphUrl}/${postId}`, {
        data: { access_token: config.facebook.pageAccessToken },
      });
    } catch (error) {
      logger.error(`Failed to hide post ${postId}:`);
    }
  }

  private async hideComment(commentId: string): Promise<void> {
    try {
      await axios.post(`${config.facebook.graphUrl}/${commentId}`, {
        is_hidden: true,
        access_token: config.facebook.pageAccessToken,
      });
    } catch (error) {
      logger.error(`Failed to hide comment ${commentId}:`);
    }
  }

  private async replyToComment(
    commentId: string,
    message: string
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${config.facebook.graphUrl}/${commentId}/comments`,
        {
          message,
          access_token: config.facebook.pageAccessToken,
        }
      );
      logger.info(`Replied to comment ${commentId}`);
      return response;
    } catch (error) {
      logger.error(`Failed to reply to comment ${commentId}:`, error);
      return null;
    }
  }

  private async processMessaging(messaging: any): Promise<void> {
    try {
      if (messaging.message) {
        await this.handleDirectMessage(messaging);
      }
      if (messaging.postback) {
        await this.handlePostback(messaging);
      }
    } catch (error) {
      logger.error("Error processing messaging event:", error);
    }
  }

  private async handleDirectMessage(messaging: any): Promise<void> {
    try {
      const senderId = messaging.sender.id;
      const message = messaging.message.text;

      if (senderId === config.facebook.pageId) return;

      const context = {
        userId: senderId,
        sessionId: `dm_${senderId}`,
        messageHistory: [],
        userProfile: {
          id: senderId,
          name: "Facebook User",
          email: "",
          membershipLevel: "basic" as const,
          createdAt: new Date(),
          lastActive: new Date(),
        },
        relevantProtocols: [],
      };

      const response = await this.geminiService.generateResponse(
        context,
        message
      );
      await this.sendDirectMessage(senderId, response.content);
    } catch (error) {
      logger.error("Error handling direct message:", error);
    }
  }

  private async handlePostback(messaging: any): Promise<void> {
    try {
      const senderId = messaging.sender.id;
      const payload = messaging.postback.payload;

      switch (payload) {
        case "GET_STARTED":
          await this.sendDirectMessage(
            senderId,
            "Welcome to QPG! I'm Q, your cannabis cultivation assistant. How can I help you today? 🌱"
          );
          break;
        case "PLANT_CLINIC":
          await this.sendDirectMessage(
            senderId,
            `For detailed cultivation support, please visit our Plant Clinic at ${config.facebook.plantClinicUrl} where I can provide comprehensive assistance with your growing questions! 🌿`
          );
          break;
      }
    } catch (error) {
      logger.error("Error handling postback:", error);
    }
  }

  private async sendDirectMessage(
    recipientId: string,
    message: string
  ): Promise<void> {
    try {
      await axios.post(
        `${config.facebook.graphUrl}/me/messages`,
        {
          recipient: { id: recipientId },
          message: { text: message },
        },
        {
          params: { access_token: config.facebook.pageAccessToken },
        }
      );
      logger.info(`Direct message sent to ${recipientId}`);
    } catch (error) {
      logger.error(`Failed to send direct message to ${recipientId}:`, error);
    }
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === "subscribe" && token === config.facebook.verifyToken) {
      logger.info("✅ Facebook webhook verified successfully");
      return challenge;
    }
    logger.warn("❌ Facebook webhook verification failed");
    return null;
  }

  private cleanupExpiredConversations(): void {
    const now = new Date();
    const expiryTime = new Date(
      now.getTime() - this.CONVERSATION_EXPIRY_HOURS * 60 * 60 * 1000
    );

    let expiredCount = 0;
    for (const [key, tracking] of this.conversationTracking.entries()) {
      if (tracking.lastReply < expiryTime) {
        this.conversationTracking.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.info(`Cleaned up ${expiredCount} expired Facebook conversations`);
    }
  }

  // Get brand ambassador statistics for monitoring
  getBrandStats(): {
    totalResponses: number;
    responseTypes: {
      generalDiscussion: number;
      courseQuestions: number;
      howToHandoffs: number;
    };
    lastActivity?: Date;
  } {
    // This would be enhanced with actual tracking in a production system
    return {
      totalResponses: 0, // Would track actual responses
      responseTypes: {
        generalDiscussion: 0,
        courseQuestions: 0,
        howToHandoffs: 0,
      },
      lastActivity: new Date(),
    };
  }
}
