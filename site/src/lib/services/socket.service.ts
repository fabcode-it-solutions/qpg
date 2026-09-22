import { io, Socket } from "socket.io-client";
import { SocketAuth, MessageResponse, SessionData } from "@/types";

// Get the socket URL from environment variables with fallback
const getSocketUrl = () => {
  // Check for client-side environment variable
  if (typeof window !== "undefined") {
    console.log("Client-side environment:", {
      envVar:
        process.env.NEXT_PUBLIC_AI_SOCKET_URL || process.env.AI_SOCKET_URL,
      windowEnv: (window as any).__ENV?.AI_SOCKET_URL,
    });
  }

  // Priority order: NEXT_PUBLIC var > window.__ENV > hardcoded fallback
  return (
    process.env.NEXT_PUBLIC_AI_SOCKET_URL ||
    (typeof window !== "undefined"
      ? (window as any).__ENV?.AI_SOCKET_URL
      : null) ||
    process.env.AI_SOCKET_URL
  );
};

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private isAuthenticated = false;
  private listenersSetup = false;

  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      // If already connected and authenticated, resolve immediately
      if (this.socket?.connected && this.isAuthenticated) {
        resolve(true);
        return;
      }

      // If connected but not authenticated, just resolve (auth will happen separately)
      if (this.socket?.connected) {
        resolve(true);
        return;
      }

      if (this.socket) {
        this.socket.disconnect();
      }

      const socketUrl = getSocketUrl();
      console.log(`Connecting to socket server at: ${socketUrl}`);

      this.socket = io(socketUrl, {
        transports: ["websocket"],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      const timeout = setTimeout(() => {
        resolve(false);
      }, 15000);

      this.socket.on("connect", () => {
        clearTimeout(timeout);
        this.isConnected = true;
        console.log("Socket connected successfully");
        resolve(true);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        this.isConnected = false;
        this.isAuthenticated = false;
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        clearTimeout(timeout);
        this.isConnected = false;
        resolve(false);
      });

      this.socket.on("reconnect", (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
        this.isConnected = true;
        // Note: Will need to re-authenticate after reconnection
        this.isAuthenticated = false;
      });
    });
  }

  authenticate(auth: SocketAuth): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve(false);
        return;
      }

      // Setup event listeners immediately after connection
      this.setupEventListeners();

      this.socket.emit("authenticate", {
        userId: auth.userId,
        userName: auth.userName,
        membershipLevel: auth.membershipLevel || "basic",
        userType: auth.userId.startsWith("prospect_") ? "prospect" : "customer",
      });

      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      this.socket.once("authenticated", () => {
        clearTimeout(timeout);
        this.isAuthenticated = true;
        resolve(true);
      });

      // Fallback in case authenticated event doesn't fire
      setTimeout(() => {
        if (!this.isAuthenticated) {
          clearTimeout(timeout);
          this.isAuthenticated = true;
          resolve(true);
        }
      }, 100);
    });
  }

  getSession(): Promise<SessionData | null> {
    return new Promise((resolve) => {
      if (!this.socket || !this.isAuthenticated) {
        resolve(null);
        return;
      }

      this.socket.emit("get_session");

      const timeout = setTimeout(() => {
        resolve(null);
      }, 5000);

      this.socket.once("session_loaded", (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });
  }

  sendMessage(message: string, imageFile?: File, plantInfo?: any, prospectContext?: any, conversationHistory?: any[]) {
    if (!this.socket || !this.isAuthenticated) return;

    console.log("🚀 Sending message with plantInfo:", plantInfo);
    console.log("🌱 Stage:", plantInfo?.stage, "Week/Day:", plantInfo?.week);

    // Determine if we're sending day number for flowering stage
    const isFlowering = plantInfo?.stage?.includes('flowering');
    const timingValue = plantInfo?.week;
    
    if (imageFile) {
      this.sendMessageWithImage(message, imageFile, plantInfo);
    } else {
      const payload = {
        message,
        stage: plantInfo?.stage,
        week: isFlowering ? undefined : timingValue,
        day: isFlowering ? timingValue : undefined,
        userType: prospectContext ? "prospect" : undefined,
        prospectContext,
        conversationHistory,
      };
      console.log("📤 Socket payload:", payload);
      this.socket.emit("send_message", payload);
    }
  }

  private async sendMessageWithImage(
    textMessage: string,
    imageFile: File,
    plantInfo?: any
  ) {
    if (!textMessage && !imageFile) {
      console.error("Cannot send an empty message.");
      return;
    }

    const payload = {
      message: textMessage,
      attachments: [] as Array<{
        mimeType: string;
        base64: string;
        name: string;
        size: number;
      }>,
    };

    if (imageFile) {
      try {
        // Convert the file to a base64 string
        const base64String = await this.fileToBase64(imageFile);

        // Add the image data to the attachments array
        payload.attachments.push({
          mimeType: imageFile.type,
          base64: base64String,
          name: imageFile.name,
          size: imageFile.size,
        });
      } catch (error) {
        console.error("Error processing image:", error);
        // Handle the error appropriately
        return;
      }
    }

    // Determine if we're sending day number for flowering stage
    const isFlowering = plantInfo?.stage?.includes('flowering');
    const timingValue = plantInfo?.week;
    
    // Emit the event to the server
    const finalPayload = {
      ...payload,
      stage: plantInfo?.stage,
      week: isFlowering ? undefined : timingValue,
      day: isFlowering ? timingValue : undefined,
    };
    console.log("📤 Socket payload with image:", finalPayload);
    this.socket?.emit("send_message", finalPayload);
  }

  /**
   * A helper function to read a File object and convert it to a base64 string.
   * @param {File} file The file to convert.
   * @returns {Promise<string>} A promise that resolves with the base64 string (without the data URI prefix).
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // The result is a string like "data:image/jpeg;base64,LzlqLzRBQ...".
        // We split and take the second part to get only the base64 data.
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => {
        reject(error);
      };
    });
  }

  clearHistory() {
    console.log("Clearing history from socket service");
    if (!this.socket || !this.isAuthenticated) return;
    this.socket.emit("clear_history");
  }

  private messageResponseCallback: ((data: MessageResponse) => void) | null =
    null;
  private sessionLoadedCallback: ((data: SessionData) => void) | null = null;
  private historyCallback: (() => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private typingCallback: ((typing: boolean) => void) | null = null;

  private setupEventListeners() {
    if (!this.socket || this.listenersSetup) return;

    console.log("Setting up socket event listeners");

    this.socket.on("message_response", (data) => {
      console.log("📨 Received message_response:", data);
      this.messageResponseCallback?.(data);
    });

    this.socket.on("session_loaded", (data) => {
      console.log("📂 Session loaded:", data);
      this.sessionLoadedCallback?.(data);
    });

    this.socket.on("history_cleared", () => {
      console.log("🗑️ History cleared");
      this.historyCallback?.();
    });

    this.socket.on("error", (data) => {
      console.log("❌ Socket error:", data);
      const errorMsg =
        typeof data === "string" ? data : data.message || "Unknown error";
      this.errorCallback?.(errorMsg);
    });

    this.socket.on("ai_typing", (data: { typing: boolean }) => {
      console.log("⌨️ AI typing:", data.typing);
      this.typingCallback?.(data.typing);
    });

    this.listenersSetup = true;
    console.log("✅ Socket event listeners setup complete");
  }

  onMessageResponse(callback: (data: MessageResponse) => void) {
    console.log("Setting message response callback");
    this.messageResponseCallback = callback;
    this.setupEventListeners();
  }

  onSessionLoaded(callback: (data: SessionData) => void) {
    this.sessionLoadedCallback = callback;
    this.setupEventListeners();
  }

  onHistoryCleared(callback: () => void) {
    this.historyCallback = callback;
    this.setupEventListeners();
  }

  onError(callback: (error: string) => void) {
    this.errorCallback = callback;
    this.setupEventListeners();
  }

  onTyping(callback: (typing: boolean) => void) {
    this.typingCallback = callback;
    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isAuthenticated = false;
      this.listenersSetup = false;
      this.messageResponseCallback = null;
      this.sessionLoadedCallback = null;
      this.historyCallback = null;
      this.errorCallback = null;
      this.typingCallback = null;
    }
  }

  get connected() {
    return this.isConnected;
  }

  get authenticated() {
    return this.isAuthenticated;
  }
}

export const socketService = new SocketService();
