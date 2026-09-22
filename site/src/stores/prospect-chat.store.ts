import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ChatMessage } from "@/types/chat";
import { socketService } from "@/lib/services/socket.service";
import { prospectSessionService } from "@/lib/services/prospect-session.service";

interface ProspectChatState {
  // State
  messages: ChatMessage[];
  isConnected: boolean;
  isAuthenticated: boolean;
  isTyping: boolean;
  error: string | null;
  prospectId: string | null;

  // Actions
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setConnectionState: (connected: boolean, authenticated: boolean) => void;
  setTyping: (typing: boolean) => void;
  setError: (error: string | null) => void;

  // Complex actions
  connect: () => Promise<boolean>;
  disconnect: () => void;
  sendMessage: (content: string) => void;
  clearChat: () => void;

  // WebSocket event handlers
  handleMessageResponse: (data: any) => void;
  handleError: (error: string) => void;
}

export const useProspectChatStore = create<ProspectChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      isConnected: false,
      isAuthenticated: false,
      isTyping: false,
      error: null,
      prospectId: null,

      // Basic actions
      setMessages: (messages) => set({ messages }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      clearMessages: () => set({ messages: [] }),

      setConnectionState: (isConnected, isAuthenticated) =>
        set({ isConnected, isAuthenticated }),

      setTyping: (isTyping) => set({ isTyping }),

      setError: (error) => set({ error }),

      // Complex actions
      connect: async () => {
        try {
          console.log("Connecting prospect chat...");

          // Load messages from localStorage first
          const session = prospectSessionService.getProspectSession();
          const history = prospectSessionService.getConversationHistory();

          set({
            prospectId: session.id,
            messages: history,
            error: null,
          });

          // Setup event listeners
          socketService.onMessageResponse(get().handleMessageResponse);
          socketService.onError(get().handleError);
          socketService.onTyping((typing: boolean) =>
            set({ isTyping: typing })
          );

          // Connect to socket
          const connected = await socketService.connect();
          if (!connected) {
            throw new Error("Failed to connect to chat server");
          }

          // Authenticate
          const authenticated = await socketService.authenticate({
            userId: session.id,
            userName: "Prospect",
            membershipLevel: "basic",
          });

          if (!authenticated) {
            throw new Error("Failed to authenticate");
          }

          set({
            isConnected: true,
            isAuthenticated: true,
            error: null,
          });

          console.log("Prospect chat connected successfully");
          return true;
        } catch (error) {
          console.error("Connection error:", error);
          set({
            isConnected: false,
            isAuthenticated: false,
            error: error instanceof Error ? error.message : "Connection failed",
          });
          return false;
        }
      },

      disconnect: () => {
        socketService.disconnect();
        set({
          isConnected: false,
          isAuthenticated: false,
          isTyping: false,
          error: null,
        });
      },

      sendMessage: (content: string) => {
        const state = get();
        if (!content.trim() || !state.isAuthenticated) {
          return;
        }

        try {
          const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            content,
            sender: "user",
            timestamp: new Date(),
          };

          // Add to store and localStorage
          get().addMessage(userMessage);
          prospectSessionService.addMessage(userMessage);

          // Set typing and clear error
          set({ isTyping: true, error: null });

          // Get context for AI
          const history = prospectSessionService.getConversationHistory();
          const prospectContext = ""; // Could add prospect-specific context here

          // Send to server
          socketService.sendMessage(
            content,
            undefined, // no image
            undefined, // no plant info
            prospectContext,
            history.slice(-4) // Last 4 messages for context
          );
        } catch (error) {
          set({
            isTyping: false,
            error: "Failed to send message",
          });
        }
      },

      clearChat: () => {
        const state = get();
        if (!state.isAuthenticated) return;

        // Clear from store and localStorage
        get().clearMessages();
        prospectSessionService.clearSession();

        // Clear from server
        socketService.clearHistory();

        set({ error: null });
      },

      // WebSocket event handlers
      handleMessageResponse: (data) => {
        try {
          if (data?.aiResponse?.content) {
            const aiMessage: ChatMessage = {
              id: data.aiResponse.id || `ai-${Date.now()}`,
              content: data.aiResponse.content,
              sender: "assistant",
              timestamp: new Date(data.aiResponse.timestamp || Date.now()),
              followUpQuestions: data.aiResponse.metadata?.followUpQuestions,
            };

            // Add to store and localStorage
            get().addMessage(aiMessage);
            prospectSessionService.addMessage(aiMessage);
          }

          set({ isTyping: false, error: null });
        } catch (error) {
          console.error("Error handling message response:", error);
          set({
            isTyping: false,
            error: "Failed to process AI response",
          });
        }
      },

      handleError: (error: string) => {
        console.error("Chat error:", error);
        set({
          isTyping: false,
          error,
        });
      },
    }),
    {
      name: "prospect-chat-store",
      partialize: (state) => ({
        // Only persist messages and prospectId
        messages: state.messages,
        prospectId: state.prospectId,
      }),
    }
  )
);
