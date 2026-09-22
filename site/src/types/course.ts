export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: string;
  priceId: string;
  categoryId: string | null;
  category: string | null;
  difficulty: string | null;
  duration: number | null;
  isPublished: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  // Additional fields from Sanity
  learningOutcomes?: string[];
  prerequisites?: string[];
  tags?: string[];
  // Milestone settings from Sanity
  milestoneSettings?: {
    enabled: boolean;
    defaultUnlockType:
      | "all_at_once"
      | "progressive_time"
      | "progressive_completion";
    showLockedContent: boolean;
    allowPreview: boolean;
    previewDuration?: number;
  };
  slug?: string; // From Sanity
}

export interface CreateCourse {
  title: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  price: string;
  priceId: string;
  category?: string;
  difficulty?: string;
  duration?: number;
}

export interface Video {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  // Bunny.net integration fields (now required)
  bunnyVideoId: string;
  bunnyLibraryId: string;
  bunnyCollectionId: string | null;
  bunnyStreamUrl: string | null;
  bunnyThumbnailUrl: string | null;
  bunnyVideoStatus: string; // processing, ready, error
  bunnyEncodingProgress: number;
  // Security settings (now required)
  tokenSecurityKey: string;
  // Video metadata
  duration: number | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  bitrate: number | null;
  framerate: string | null;
  codec: string | null;
  // Organization
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVideo {
  courseId: string;
  title: string;
  description?: string;
  // Bunny.net integration fields (now required)
  bunnyVideoId: string;
  bunnyLibraryId: string;
  bunnyCollectionId?: string;
  bunnyStreamUrl?: string;
  bunnyThumbnailUrl?: string;
  bunnyVideoStatus?: string;
  bunnyEncodingProgress?: number;
  // Security settings (now required)
  tokenSecurityKey: string;
  // Video metadata
  duration?: number;
  width?: number;
  height?: number;
  fileSize?: number;
  bitrate?: number;
  framerate?: string;
  codec?: string;
  // Organization
  order: number;
  isPublished?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  courseId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeProductId: string | null;
  stripePriceId: string | null;
  status: string;
  startedAt: Date | null;
  expiresAt: Date | null;
  canceledAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UserProgress {
  id: string;
  userId: string;
  videoId: string;
  courseId: string;
  watchedDuration: number | null;
  isCompleted: boolean | null;
  lastWatchedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CourseWithVideos extends Course {
  videos: Video[];
}

export interface CourseProgress {
  courseId: string;
  totalVideos: number;
  completedVideos: number;
  progressPercentage: number;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  courseId: string;
  subscriptionId: string;
  stripePaymentIntentId: string | null;
  stripeInvoiceId: string | null;
  amount: string;
  currency: string;
  status: "succeeded" | "failed" | "pending" | "refunded";
  type: "subscription_create" | "subscription_renew" | "refund";
  description: string | null;
  invoiceUrl: string | null;
  receiptUrl: string | null;
  failureReason: string | null;
  paidAt: Date | null;
  createdAt: Date | null;
}

export interface StripeWebhookEvent {
  id: string;
  stripeEventId: string;
  eventType: string;
  processed: boolean;
  processedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date | null;
}

export interface CourseProgressData {
  courseId: string;
  progressPercentage: number;
  completedVideos: number;
  totalVideos: number;
  totalDuration: number;
  watchedDuration: number;
  lastActivityAt: Date | null;
  estimatedTimeRemaining: number;
  isLoading: boolean;
  error: string | null;
}

export interface VideoProgressItem {
  videoId: string;
  title: string;
  duration: number | null;
  watchedDuration: number;
  progressPercentage: number;
  isCompleted: boolean;
  lastWatchedAt: Date | null;
}

export interface CourseAccessProps {
  courseId: string;
  course: Course;
  children: React.ReactNode;
}

export interface CourseDetailProps {
  course: Course;
  videos: Video[];
  hasAccess: boolean;
  progress?: CourseProgress;
}

export interface CourseCardProps {
  course: Course;
}

export interface CourseGridProps {
  courses: Course[];
  searchQuery?: string;
  category?: string;
}

export interface CourseProgressBarProps {
  courseId: string;
  initialProgress?: CourseProgress;
}

export interface CourseDetailWithMilestonesProps {
  course: Course & {
    progressiveUnlock?: {
      enabled: boolean;
      showLockedVideos: boolean;
      allowPreview: boolean;
    };
  };
  hasAccess: boolean;
  progress?: CourseProgress | null;
}

export interface CourseMilestonesProps {
  courseId: string;
  courseSlug: string;
}

export interface VideoWithAccess {
  id: string;
  title: string;
  order: number;
  duration?: number;
  isUnlocked: boolean;
  canPreview: boolean;
  unlockReason?: string;
  unlockDate?: string;
  isFree: boolean;
  unlockSettings?: {
    unlockType: "immediate" | "after_days" | "after_completion";
    unlockAfterDays?: number;
    requirePreviousVideo?: boolean;
  };
}

export interface CourseVideoData {
  course: {
    id: string;
    title: string;
    progressiveUnlock?: {
      enabled: boolean;
      showLockedVideos: boolean;
      allowPreview: boolean;
    };
  };
  videos: VideoWithAccess[];
}

export interface UseCourseVideoAccessReturn {
  data: CourseVideoData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  checkVideoAccess: (videoId: string) => Promise<VideoAccessInfo | null>;
}

export interface VideoAccessInfo {
  video: {
    id: string;
    title: string;
    duration?: number;
    isFree: boolean;
  };
  access: {
    isUnlocked: boolean;
    canPreview: boolean;
    unlockReason?: string;
    unlockDate?: string;
  };
}
