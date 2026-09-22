import { ChatMessage } from "@/types/chat";

export interface ProspectSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActivity: Date;
}

class ProspectSessionService {
  private readonly STORAGE_KEY = "qpg_prospect_session";
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  generateProspectId(): string {
    return `prospect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getProspectSession(): ProspectSession {
    if (typeof window === "undefined") {
      return this.createNewSession();
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return this.createNewSession();
      }

      const session = JSON.parse(stored);
      // Check if session is expired
      const now = new Date();
      const lastActivity = new Date(session.lastActivity);
      if (now.getTime() - lastActivity.getTime() > this.SESSION_DURATION) {
        return this.createNewSession();
      }

      // Ensure timestamps are Date objects and messages have proper format
      return {
        ...session,
        createdAt: new Date(session.createdAt),
        lastActivity: new Date(session.lastActivity),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          isUser: msg.sender === "user" || msg.isUser === true,
        })),
      };
    } catch (error) {
      console.error("Error loading prospect session:", error);
      return this.createNewSession();
    }
  }

  saveProspectSession(session: ProspectSession): void {
    if (typeof window === "undefined") return;

    try {
      session.lastActivity = new Date();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error("Error saving prospect session:", error);
    }
  }

  addMessage(message: ChatMessage): void {
    const session = this.getProspectSession();
    session.messages.push(message);
    this.saveProspectSession(session);
  }

  getConversationHistory(): ChatMessage[] {
    const session = this.getProspectSession();
    return session.messages;
  }

  clearSession(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private createNewSession(): ProspectSession {
    const session: ProspectSession = {
      id: this.generateProspectId(),
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.saveProspectSession(session);
    return session;
  }
}

export const prospectSessionService = new ProspectSessionService();
