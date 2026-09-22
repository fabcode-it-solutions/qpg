export * from "./auth";
export * from "./user";
export * from "./next-auth";
export * from "./chat";
export * from "./course";
export * from "./common";
export * from "./bunny";
export * from "./ui";
export * from "./blogs";
export * from "./protocol";
// export * from "./email"; // Commented out to avoid conflicts - use explicit exports below

// Explicit exports to resolve conflicts
export type {
  OutlineTextType,
  EffectPointsType,
  PricePlanCardType,
  FeaturedCardType,
  BlogCardType,
  TokenValidationResult,
  RateLimitStore,
  FormData,
  FormErrors
} from "./global";

// Email types with explicit naming to avoid conflicts
export type {
  EmailData,
  PurchaseConfirmationData,
  ContactFormData as EmailContactFormData,
  EmailServiceConfig
} from "./email";

export type {
  VideoPlayerProps,
  VideoAccessLog,
  SuspiciousActivity,
  SecureVideoData,
  ProgressData,
  UseVideoProgressProps,
  ProgressUpdate,
  BunnyVideoData,
  VideoData,
  Statistics,
  VideoPageProps,
  SecurityAnalytics,
  VideoSecurityAnalyticsProps,
  VideoProgressUpdate,
  ProgressAnalytics,
  MilestoneData,
  VideoAccessInfo,
  CourseVideoAccess
} from "./video";

export type {
  DashboardStats
} from "./dashboard";

export type {
  VideoProgress,
  CourseProgress,
  VideoProgressState,
  UseVideoProgressTrackingProps,
  UseVideoProgressTrackingReturn,
  UseCourseProgressTrackingProps,
  UseCourseProgressTrackingReturn
} from "./video-progress";

// Use dashboard types as primary for these conflicting types
export type {
  DashboardData,
  UserProgressOverview,
  CourseProgressSummary
} from "./dashboard";
