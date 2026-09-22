import { logger } from "../utils/logger";

interface UserRateLimit {
  userId: string;
  messageCount: number;
  windowStart: Date;
  lastMessage: Date;
}

export class RateLimiterService {
  private userLimits: Map<string, UserRateLimit> = new Map();
  private readonly MESSAGES_PER_MINUTE = 10;
  private readonly WINDOW_SIZE = 60 * 1000; // 1 minute
  private readonly MIN_MESSAGE_INTERVAL = 2000; // 2 seconds between messages

  checkRateLimit(userId: string): {
    allowed: boolean;
    message?: string;
    retryAfter?: number;
  } {
    const now = new Date();
    const userLimit = this.getUserLimit(userId);

    // Check minimum interval between messages
    if (userLimit.lastMessage && (now.getTime() - userLimit.lastMessage.getTime()) < this.MIN_MESSAGE_INTERVAL) {
      const waitTime = Math.ceil((this.MIN_MESSAGE_INTERVAL - (now.getTime() - userLimit.lastMessage.getTime())) / 1000);
      return {
        allowed: false,
        message: `Please wait ${waitTime} seconds before sending another message.`,
        retryAfter: waitTime
      };
    }

    // Reset window if expired
    if (now.getTime() - userLimit.windowStart.getTime() > this.WINDOW_SIZE) {
      userLimit.messageCount = 0;
      userLimit.windowStart = now;
    }

    // Check rate limit
    if (userLimit.messageCount >= this.MESSAGES_PER_MINUTE) {
      const resetTime = Math.ceil((this.WINDOW_SIZE - (now.getTime() - userLimit.windowStart.getTime())) / 1000);
      return {
        allowed: false,
        message: `Rate limit exceeded. You can send ${this.MESSAGES_PER_MINUTE} messages per minute. Try again in ${resetTime} seconds.`,
        retryAfter: resetTime
      };
    }

    // Update counters
    userLimit.messageCount++;
    userLimit.lastMessage = now;

    return { allowed: true };
  }

  private getUserLimit(userId: string): UserRateLimit {
    if (!this.userLimits.has(userId)) {
      this.userLimits.set(userId, {
        userId,
        messageCount: 0,
        windowStart: new Date(),
        lastMessage: new Date(0)
      });
    }
    return this.userLimits.get(userId)!;
  }

  // Clean up old rate limit data
  cleanup(): void {
    const cutoff = Date.now() - (this.WINDOW_SIZE * 2);
    
    for (const [userId, limit] of this.userLimits.entries()) {
      if (limit.windowStart.getTime() < cutoff) {
        this.userLimits.delete(userId);
      }
    }
    
    logger.debug(`Rate limiter cleanup completed. Active users: ${this.userLimits.size}`);
  }
}