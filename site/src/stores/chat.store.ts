import { create } from "zustand";
import { ChatMessage } from "@/types";
import { socketService } from "@/lib/services/socket.service";

interface PlantInfo {
  stage: string;
  week: number;
}

interface ChatState {
  // State
  messages: ChatMessage[];
  isConnected: boolean;
  isAuthenticated: boolean;
  isTyping: boolean;
  error: string | null;
  storedPlantInfo: PlantInfo | null;
  isProcessingClinic: boolean;

  // Actions
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setConnectionState: (connected: boolean, authenticated: boolean) => void;
  setTyping: (typing: boolean) => void;
  setError: (error: string | null) => void;
  setPlantInfo: (info: PlantInfo | null) => void;

  // Complex actions
  sendMessage: (content: string, imageFile?: File, plantInfo?: any) => void;
  clearHistory: () => void;
  clearHistoryAndSendMessage: (
    message: string,
    imageFile?: File,
    plantInfo?: any
  ) => void;

  // WebSocket event handlers
  handleMessageResponse: (data: any) => void;
  handleSessionLoaded: (data: any) => void;
  handleHistoryCleared: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Initial state
  messages: [],
  isConnected: false,
  isAuthenticated: false,
  isTyping: false,
  error: null,
  storedPlantInfo: null,
  isProcessingClinic: false,

  // Basic actions
  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  clearMessages: () => set({ messages: [] }),

  setConnectionState: (isConnected, isAuthenticated) =>
    set({ isConnected, isAuthenticated }),

  setTyping: (isTyping) => set({ isTyping }),

  setError: (error) => set({ error }),

  setPlantInfo: (storedPlantInfo) => set({ storedPlantInfo }),

  // Complex actions
  sendMessage: (content, imageFile, initialPlantInfo) => {
    const state = get();
    if ((!content.trim() && !imageFile) || !state.isAuthenticated) {
      return;
    }

    try {
      // Create attachments array if image is provided
      const attachments: any[] = [];
      let blobUrl: string | null = null;

      if (imageFile) {
        blobUrl = URL.createObjectURL(imageFile);
        attachments.push({
          mimeType: imageFile.type,
          fileName: imageFile.name,
          imageUrl: blobUrl,
          blobUrl: blobUrl,
        });
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content:
          content || (imageFile ? `[Uploaded image: ${imageFile.name}]` : ""),
        isUser: true,
        sender: "user",
        timestamp: new Date(),
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      // Add message to store
      get().addMessage(userMessage);
      set({ isTyping: true, error: null });

      // Handle plant info
      const plantInfo = initialPlantInfo || state.storedPlantInfo;
      if (initialPlantInfo && !state.storedPlantInfo) {
        get().setPlantInfo({
          stage: initialPlantInfo.stage,
          week: initialPlantInfo.week,
        });
      }

      // Send to server
      socketService.sendMessage(content, imageFile, plantInfo);
    } catch (error) {
      set({ isTyping: false, error: "Failed to send message" });
    }
  },

  clearHistory: () => {
    const state = get();
    if (!state.isAuthenticated) return;

    set({ messages: [] });
    socketService.clearHistory();
    get().setPlantInfo(null);
  },

  clearHistoryAndSendMessage: (message, imageFile, plantInfo) => {
    const state = get();
    if (!state.isAuthenticated || state.isProcessingClinic) return;

    set({ isProcessingClinic: true, messages: [], storedPlantInfo: null });

    const safetyTimeout = setTimeout(() => {
      set({ isProcessingClinic: false, error: "Clear history timed out" });
      // Remove the listener if timeout occurs before history is cleared
      socketService.onHistoryCleared(() => {});
    }, 10000);

    const handleHistoryClearedAndSendMessage = () => {
      clearTimeout(safetyTimeout);
      socketService.onHistoryCleared(() => {}); // Remove this specific listener
      get().sendMessage(message, imageFile, plantInfo);
      set({ isProcessingClinic: false });
    };

    socketService.onHistoryCleared(handleHistoryClearedAndSendMessage);
    socketService.clearHistory();
  },

  // WebSocket event handlers
  handleMessageResponse: (data) => {
    try {
      const state = get();

      // Update user message with attachments if needed
      if (
        data?.userMessage?.attachments &&
        data.userMessage.attachments.length > 0
      ) {
        const userMessages = state.messages.filter(
          (m) => m.isUser && m.id.startsWith("user-")
        );
        if (userMessages.length > 0) {
          const lastUserMessage = userMessages[userMessages.length - 1];
          get().updateMessage(lastUserMessage.id, {
            attachments: data.userMessage.attachments?.map((att: any) => ({
              ...att,
              imageUrl: att.url || att.imageUrl,
              fileName: att.originalName || att.fileName,
            })),
          });
        }
      }

      // Add AI message
      if (data?.aiResponse?.content) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          content: data.aiResponse.content,
          isUser: false,
          sender: "assistant",
          timestamp: new Date(),
          followUpQuestions: data.aiResponse.metadata?.followUpQuestions,
          attachments: data.aiResponse.attachments?.map((att: any) => ({
            ...att,
            imageUrl: att.url || att.imageUrl,
            fileName: att.originalName || att.fileName,
          })),
          metadata: data.aiResponse.metadata,
        };

        get().addMessage(aiMessage);
      }

      set({ isTyping: false, error: null });
    } catch (error) {
      set({ isTyping: false, error: "Failed to process AI response" });
    }
  },

  handleSessionLoaded: (data) => {
    const state = get();

    // Skip session loads during clinic processing or if messages already exist
    if (state.isProcessingClinic || state.messages.length > 0) {
      return;
    }

    // Only load if we have actual messages to load
    if (!data.messages || data.messages.length === 0) {
      return;
    }

    const sessionMessages: ChatMessage[] = data.messages.map(
      (msg: any, index: number) => ({
        id: `loaded-${index}-${Date.now()}`,
        content: msg.content,
        isUser: msg.role === "user",
        timestamp: new Date(msg.timestamp),
        attachments:
          msg.attachments?.map((att: any) => ({
            ...att,
            imageUrl: att.url || att.imageUrl,
            fileName: att.originalName || att.fileName,
          })) || undefined,
        metadata: msg.metadata,
      })
    );

    get().setMessages(sessionMessages);
  },

  handleHistoryCleared: () => {
    const state = get();
    // Don't clear messages if we're processing clinic data
    if (state.isProcessingClinic) {
      return;
    }

    get().clearMessages();
    get().setPlantInfo(null);
  },
}));
