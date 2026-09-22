import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { SimplifiedChatService } from "./simplified-chat.service";
import { ProspectChatService } from "./prospect-chat.service";
import { ContentFilterService } from "./content-filter.service";
import { RateLimiterService } from "./rate-limiter.service";
import { logger } from "../utils/logger";
import { User } from "../types";

export class SimplifiedWebSocketService {
  private io: SocketIOServer;
  private chatService: SimplifiedChatService;
  private prospectChatService: ProspectChatService;
  private contentFilter: ContentFilterService;
  private rateLimiter: RateLimiterService;

  constructor(httpServer: HTTPServer, chatService: SimplifiedChatService) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      // Optimized settings
      maxHttpBufferSize: 10e6, // 10MB limit for uploads
      pingTimeout: 60000, // 60s ping timeout
      pingInterval: 25000, // 25s ping interval
    });

    this.chatService = chatService;
    this.prospectChatService = new ProspectChatService(
      chatService["databaseService"]
    );
    this.contentFilter = new ContentFilterService();
    this.rateLimiter = new RateLimiterService();
    this.setupEventHandlers();

    // Clean up old activity data every hour
    setInterval(() => {
      this.contentFilter.cleanupOldActivity();
      this.rateLimiter.cleanup();
    }, 60 * 60 * 1000);
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket) => {
      logger.info(
        `🔌 Client connected: ${socket.id?.substring(0, 12) || "unknown"}`
      );

      // Send connection confirmation
      socket.emit("test_connection", {
        message: "WebSocket connection established",
        workflow: "simplified_diagnostic",
        timestamp: new Date().toISOString(),
      });

      // Handle user authentication
      socket.on(
        "authenticate",
        async (data: {
          userId: string;
          userName: string;
          membershipLevel?: string;
          userType?: string;
        }) => {
          const isProspect =
            data.userId.startsWith("prospect_") || data.userType === "prospect";

          const user: User = {
            id: data.userId,
            name: data.userName,
            email: `${data.userId}@example.com`,
            membershipLevel: isProspect
              ? "prospect"
              : (data.membershipLevel as any) || "basic",
            createdAt: new Date(),
            lastActive: new Date(),
          };

          socket.data.user = user;
          socket.data.isProspect = isProspect;
          socket.join(`user_${data.userId}`);
          socket.emit("authenticated", {
            success: true,
            workflow: isProspect ? "prospect_sales" : "simplified_diagnostic",
            version: "1.0.0",
          });
          logger.info(
            `✅ ${isProspect ? "Prospect" : "User"} authenticated: ${
              data.userId
            }`
          );

          // Load session data after authentication
          try {
            if (isProspect) {
              const messages =
                await this.prospectChatService.getProspectHistory(data.userId);
              if (messages.length > 0) {
                socket.emit("session_loaded", {
                  userId: data.userId,
                  messageCount: messages.length,
                  messages: messages,
                  workflow: "prospect_sales",
                  timestamp: new Date().toISOString(),
                });
                logger.info(
                  `📂 Auto-loaded prospect session: ${data.userId?.substring(
                    0,
                    12
                  )} with ${messages.length} messages`
                );
              }
            } else {
              const session = await this.chatService.getUserSession(
                data.userId
              );
              const messages = session?.messages || [];
              if (messages.length > 0) {
                socket.emit("session_loaded", {
                  userId: data.userId,
                  messageCount: messages.length,
                  messages: messages,
                  workflow: "simplified_diagnostic",
                  timestamp: new Date().toISOString(),
                });
                logger.info(
                  `📂 Auto-loaded session for user: ${data.userId?.substring(
                    0,
                    8
                  )} with ${messages.length} messages`
                );
              }
            }
          } catch (error) {
            logger.error("Error auto-loading session:", error);
          }
        }
      );

      // Handle manual session loading (still keep for explicit requests)
      socket.on("get_session", async () => {
        try {
          if (!socket.data.user) {
            socket.emit("error", { message: "Authentication required" });
            return;
          }

          logger.info(
            `📂 Manual session load for user: ${
              socket.data.user.id?.substring(0, 8) || "unknown"
            }`
          );
          const session = await this.chatService.getUserSession(
            socket.data.user.id
          );
          const messages = session?.messages || [];

          socket.emit("session_loaded", {
            userId: socket.data.user.id,
            messageCount: messages.length,
            messages: messages,
            workflow: "simplified_diagnostic",
            timestamp: new Date().toISOString(),
          });

          logger.info(
            `📂 Manual session loaded for user: ${
              socket.data.user.id?.substring(0, 8) || "unknown"
            } with ${messages.length} messages`
          );
        } catch (error) {
          logger.error("Error loading session:", error);
          socket.emit("error", { message: "Failed to load session" });
        }
      });

      // Handle message sending
      socket.on(
        "send_message",
        async (data: {
          message: string;
          attachments?: any[];
          stage?: string;
          week?: number;
          day?: number;
          userType?: string;
          prospectContext?: any;
          conversationHistory?: any[];
        }) => {
          logger.info(
            `📨 Received message from client: "${data.message.substring(
              0,
              50
            )}..."`
          );

          // Send immediate acknowledgment
          socket.emit("message_received", {
            message: data.message,
            timestamp: new Date().toISOString(),
            status: "processing",
            workflow: "simplified_diagnostic",
          });

          try {
            if (!socket.data.user) {
              logger.error("❌ No authenticated user for message");
              socket.emit("error", { message: "Authentication required" });
              return;
            }

            logger.info(
              `🔄 Processing message for user ${socket.data.user.id}, stage: ${data.stage}, week: ${data.week}, day: ${data.day}`
            );

            // Check rate limit first
            const rateLimitResult = this.rateLimiter.checkRateLimit(
              socket.data.user.id
            );
            if (!rateLimitResult.allowed) {
              socket.emit("error", {
                message: rateLimitResult.message,
                retryAfter: rateLimitResult.retryAfter,
              });
              return;
            }

            // Check if this might be a diagnostic answer first
            const session = await this.chatService.getUserSession(
              socket.data.user.id
            );
            const messages = session?.messages || [];
            const lastAiMessage = messages
              .filter((m: any) => m.role === "assistant")
              .pop();

            const isDiagnosticAnswer =
              lastAiMessage?.metadata?.category === "diagnostic_questions" ||
              lastAiMessage?.metadata?.step === "diagnostic_questions";

            // Check content relevance - use different filter for prospects
            const filterResult = socket.data.isProspect
              ? await this.contentFilter.checkProspectRelevance(
                  socket.data.user.id,
                  data.message
                )
              : await this.contentFilter.checkRelevance(
                  socket.data.user.id,
                  data.message,
                  isDiagnosticAnswer
                );

            if (
              !filterResult.isRelevant &&
              (filterResult.shouldWarn || filterResult.shouldBlock)
            ) {
              socket.emit("ai_typing", { typing: false });

              const warningMessage = {
                id: `warning-${Date.now()}`,
                content:
                  filterResult.message ||
                  "Please ask cannabis cultivation-related questions only.",
                role: "assistant",
                timestamp: new Date().toISOString(),
                userId: socket.data.user.id,
                metadata: {
                  type: filterResult.shouldBlock
                    ? "content_block"
                    : "content_warning",
                  workflow: "content_filter",
                  processedAt: new Date().toISOString(),
                },
              };

              socket.emit("message_response", {
                userMessage: {
                  id: `user-${Date.now()}`,
                  content: data.message,
                  role: "user",
                  timestamp: new Date().toISOString(),
                  userId: socket.data.user.id,
                  attachments: [],
                },
                aiResponse: warningMessage,
                metadata: {
                  workflow: "content_filter",
                  category: "warning",
                  timestamp: new Date().toISOString(),
                },
              });

              return;
            }

            socket.emit("ai_typing", { typing: true });

            // Debug logging for development
            if (process.env.NODE_ENV === "development") {
              socket.emit("debug_immediate", {
                test: "Simplified WebSocket is working - message received",
                userId: socket.data.user.id,
                message: data.message,
                workflow: "simplified_diagnostic",
                timestamp: new Date().toISOString(),
              });
            }

            const startTime = Date.now();
            let result;

            // Handle prospect vs customer messages differently
            if (socket.data.isProspect) {
              result = await this.prospectChatService.handleProspectMessage(
                socket.data.user.id,
                data.message,
                data.conversationHistory || [],
                data.prospectContext
              );
            } else {
              logger.info(
                `🌱 Sending to chat service - stage: ${data.stage}, week: ${data.week}, day: ${data.day}`
              );
              result = await this.chatService.sendMessage(
                socket.data.user.id,
                data.message,
                socket.data.user,
                data.attachments || [],
                data.stage,
                data.week,
                data.day
              );
            }

            const processingTime = Date.now() - startTime;

            logger.info(
              `✅ Message processed in ${processingTime}ms for user ${socket.data.user.id}`
            );

            // Stop typing indicator
            socket.emit("ai_typing", { typing: false });

            // Validate response data
            if (!result || !result.userMessage || !result.aiResponse) {
              throw new Error("Invalid response data from chat service");
            }

            // Prepare response payload
            const responsePayload = {
              userMessage: {
                id: result.userMessage.id,
                content: result.userMessage.content,
                role: result.userMessage.role,
                timestamp: result.userMessage.timestamp,
                userId: result.userMessage.userId,
                attachments: result.userMessage.attachments || [],
              },
              aiResponse: {
                id: result.aiResponse.id,
                content: result.aiResponse.content,
                role: result.aiResponse.role,
                timestamp: result.aiResponse.timestamp,
                userId: result.aiResponse.userId,
                metadata: {
                  ...result.aiResponse.metadata,
                  workflow: socket.data.isProspect
                    ? "prospect_sales"
                    : "simplified_diagnostic",
                  processingTime: processingTime,
                  followUpQuestions:
                    result.aiResponse.metadata?.followUpQuestions,
                },
                attachments: result.aiResponse.attachments || [],
              },
              followUpQuestions: result.aiResponse.metadata?.followUpQuestions,
              metadata: {
                workflow: socket.data.isProspect
                  ? "prospect_sales"
                  : "simplified_diagnostic",
                category: result.aiResponse.metadata?.category || "general",
                step: result.aiResponse.metadata?.step || "complete",
                processingTime: processingTime,
                timestamp: new Date().toISOString(),
              },
            };

            // Log attachment details for debugging
            if (
              result.userMessage.attachments &&
              result.userMessage.attachments.length > 0
            ) {
              logger.debug(
                `📎 Sending ${result.userMessage.attachments.length} attachment(s) to frontend`
              );
            }

            logger.info(`📤 Sending response to client`);
            socket.emit("message_response", responsePayload);

            logger.info(
              `✅ Response sent successfully for user ${socket.data.user.id}`
            );
          } catch (error) {
            logger.error("Error processing message:", error);

            // Stop typing indicator on error
            socket.emit("ai_typing", { typing: false });

            // Send error response
            socket.emit("error", {
              message:
                "I'm having some technical difficulties right now. Please try again in a moment.",
              workflow: "simplified_diagnostic",
              error: "processing_failed",
              timestamp: new Date().toISOString(),
            });
          }
        }
      );

      socket.on("get_history", async () => {
        try {
          if (!socket.data.user) {
            socket.emit("error", { message: "Authentication required" });
            return;
          }

          const messages = await this.chatService.getUserHistory(
            socket.data.user.id
          );
          socket.emit("history_loaded", { messages });
        } catch (error) {
          logger.error("Error getting history:", error);
          socket.emit("error", { message: "Failed to get history" });
        }
      });

      socket.on("clear_history", async () => {
        try {
          if (!socket.data.user) {
            socket.emit("error", { message: "Authentication required" });
            return;
          }

          if (socket.data.isProspect) {
            await this.prospectChatService.clearProspectHistory(
              socket.data.user.id
            );
          } else {
            await this.chatService.clearUserHistory(socket.data.user.id);
          }

          socket.emit("history_cleared", { success: true });
        } catch (error) {
          logger.error("Error clearing history:", error);
          socket.emit("error", { message: "Failed to clear history" });
        }
      });

      // Handle disconnection
      socket.on("disconnect", (reason) => {
        logger.info(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
        if (socket.data.user) {
          logger.info(`👤 User ${socket.data.user.id} disconnected`);
        }
      });

      // Handle connection errors
      socket.on("error", (error) => {
        logger.error(`🔌 Socket error for ${socket.id}:`, error);
      });
    });

    // Global error handler
    this.io.engine.on("connection_error", (err) => {
      logger.error("Connection error:", {
        message: err.message,
        description: err.description,
        context: err.context,
        type: err.type,
      });
    });

    logger.info("🔌 Simplified WebSocket service initialized successfully");
  }

  // Method to send system notifications (if needed)
  public sendNotificationToUser(userId: string, notification: any): void {
    this.io.to(`user_${userId}`).emit("notification", {
      ...notification,
      workflow: "simplified_diagnostic",
      timestamp: new Date().toISOString(),
    });
  }

  // Method to broadcast system messages (if needed)
  public broadcastSystemMessage(message: any): void {
    this.io.emit("system_message", {
      ...message,
      workflow: "simplified_diagnostic",
      timestamp: new Date().toISOString(),
    });
  }
}
