export interface User {
  id: string;
  email: string;
  name: string;
  membershipLevel: "basic" | "premium" | "pro";
  createdAt: Date;
  lastActive: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  attachments?: FileAttachment[];
  metadata?: Record<string, any>;
}

export interface FileAttachment {
  mimeType: string;
  originalName?: string;
  size?: number;
  url?: string;
  imageUrl?: string;
  error?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface FacebookPost {
  id: string;
  message: string;
  from: {
    id: string;
    name: string;
  };
  created_time: string;
  attachments?: any[];
}

export interface FacebookComment {
  id: string;
  message: string;
  from: {
    id: string;
    name: string;
  };
  created_time: string;
  parent?: {
    id: string;
  };
}

export interface CultivationProtocol {
  category: string;
  title: string;
  content: string;
  tags: string[];
  priority: number;
}

export interface AIResponse {
  content: string;
  confidence: number;
  sources?: string[];
  followUpQuestions?: string[];
}

export interface ModerationResult {
  action: "approve" | "reject" | "review";
  reason: string;
  confidence: number;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  messageHistory: ChatMessage[];
  userProfile: User;
  relevantProtocols: CultivationProtocol[];
}

export interface AgentState {
  userId: string;
  sessionId: string;
  currentStep: string;
  context: any;
  protocols: any[];
  needsFollowUp: boolean;
  pestDiagnosisStep?: "initial" | "clarifying" | "diagnosed";
}

export interface PestDiagnosisArgs {
  symptoms: string;
  plantStage: string;
  damageDescription: string;
}

export interface ProtocolRetrievalArgs {
  category: string;
  query: string;
}

export interface NutrientCalculatorArgs {
  plantStage: string;
  feedingWeek: number;
}

export interface WateringAssessmentArgs {
  containerSize: string;
  lastWatered: string;
  soilMoisture: string;
  plantStage: string;
}

export interface EnvironmentAssessmentArgs {
  temperature: number;
  humidity: number;
  lightingType: string;
  plantStage: string;
}

export interface SeedPropagationArgs {
  seedType: string;
  soilType: string;
  environmentConditions?: string;
}

export interface CloningArgs {
  motherPlantAge: string;
  cuttingType: string;
  rooting_medium: string;
}

export interface DryingAssessmentArgs {
  temperature: number;
  humidity: number;
  dryingDays: number;
  trimMethod: string;
}

export interface CuringAssessmentArgs {
  jarHumidity: number;
  curingWeeks: number;
  burpingFrequency: string;
}

export interface DiagnosticAnalysisArgs {
  plantInfo: string;
  symptoms: string;
  plantStage: string;
  weekNumber?: number;
  imageAnalysis?: string;
  userDescription: string;
}

export interface DiagnosticQuestionArgs {
  hypothesis: string;
  plantStage: string;
  symptoms: string;
  previousAnswers?: string;
}

export interface DiagnosticSolutionArgs {
  finalDiagnosis: string;
  plantStage: string;
  weekNumber?: number;
  userActions: string;
  protocolDeviations: string;
}
