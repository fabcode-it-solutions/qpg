export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "assistant";
  isUser?: boolean; // Computed property for backward compatibility
  timestamp: Date;
  followUpQuestions?: string[];
  imageUrl?: string;
  attachments?: ChatAttachment[];
  metadata?: {
    category?: string;
    workflowStep?: number;
    sessionId?: string;
    questionsCount?: number;
    answeredQuestions?: number;
    totalQuestions?: number;
    [key: string]: any;
  };
}

export interface ChatAttachment {
  url?: string; // S3/local file URL from backend
  mimeType: string;
  originalName?: string;
  size?: number;
  error?: string;
  // Frontend-only fields for UI
  imageUrl?: string; // For immediate preview
  base64?: string; // For sending to backend
  fileName?: string; // Alias for originalName
  blobUrl?: string; // Blob URL for temporary display
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocketAuth {
  userId: string;
  userName: string;
  membershipLevel?: "basic" | "premium" | "pro";
}

export interface SendMessagePayload {
  message: string;
  attachments?: ChatAttachment[];
}

export interface MessageResponse {
  userMessage: {
    id: string;
    content: string;
    role: string;
    timestamp: string;
    userId: string;
    attachments?: ChatAttachment[];
  };
  aiResponse: {
    id: string;
    content: string;
    role: string;
    timestamp: string;
    userId: string;
    attachments?: ChatAttachment[];
    metadata?: {
      followUpQuestions?: string[];
      error?: boolean;
      errorType?: string;
    };
  };
}

export interface SessionData {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    attachments?: ChatAttachment[];
  }>;
}

/**
 * Props interface for ChatInput component
 */
export interface PlantInfo {
  stage: "seedling" | "veg" | "flower";
  week: number;
}

export interface ChatInputProps {
  /** Callback function when message is sent */
  onSendMessage: (message: string, image?: File) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether to show image upload button */
  showImageUpload?: boolean;
}

export interface EnhancedChatInputProps {
  /** Callback function when message is sent with plant info */
  onSendMessage: (message: string, plantInfo: PlantInfo, image?: File) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether in diagnostic mode */
  isDiagnosticMode?: boolean;
  /** AI-generated suggestions */
  suggestions?: string[];
  /** Callback when suggestion is clicked */
  onSuggestionClick?: (suggestion: string) => void;
}

export interface ChatMessageProps {
  message: ChatMessage;
  onFollowUpClick?: (question: string) => void;
}

export interface ChatSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
}
