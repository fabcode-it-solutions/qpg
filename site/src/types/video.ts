import { TransformedVideo } from "@/lib/sanity";
import { Video, Course } from "./course";

export interface VideoPlayerProps {
  video: Video;
  course: Course;
  hasAccess: boolean;
  canPreview?: boolean;
  userProgress?: any;
}

export interface VideoAccessLog {
  id: string;
  userId: string;
  videoId: string;
  courseId: string;
  action: string; // stream_started, stream_ended, token_generated
  ip: string;
  userAgent: string;
  timestamp: Date;
}

export interface SuspiciousActivity {
  id: string;
  userId: string;
  videoId?: string;
  activityType: string; // token_mismatch, rapid_location_change, concurrent_limit_exceeded
  details?: string;
  resolved?: Date;
  timestamp: Date;
}

export interface SecureVideoData {
  id: string;
  title: string;
  description: string;
  streamUrl: string;
  iframeUrl: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  expiresAt: string;
}

export interface ProgressData {
  videoId: string;
  courseId: string;
  watchedDuration: number;
  totalDuration: number;
  isCompleted: boolean;
  lastWatchedAt: Date;
  progressPercentage: number;
}

export interface UseVideoProgressProps {
  video: Video;
  course: Course;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hasAccess: boolean;
  initialProgress?: any;
}

export interface ProgressUpdate {
  videoId: string;
  courseId: string;
  watchedDuration: number;
  isCompleted: boolean;
  milestone?: number; // 25, 50, 75, 100
  eventType: "play" | "pause" | "seek" | "interval" | "milestone" | "complete";
}

// Interface for Bunny.net video data
export interface BunnyVideoData {
  guid: string;
  title: string;
  length: number;
  width: number;
  height: number;
  framerate: number;
  storageSize: number;
  thumbnailFileName: string;
  status: number;
  encodeProgress: number;
}

export interface VideoData {
  id: string;
  title: string;
  courseId: string;
  videoUrl: string;
  bunnyVideoId: string | null;
  bunnyVideoStatus: string | null;
  bunnyStreamUrl: string | null;
  isPublished: boolean | null;
  createdAt: string;
}

export interface Statistics {
  totalVideos: number;
  videosWithBunnyId: number;
  videosReady: number;
  videosProcessing: number;
  videosWithoutBunny: number;
  publishedVideos: number;
}

export interface VideoPageProps {
  params: Promise<{
    courseId: string;
    videoId: string;
  }>;
}

export interface SecurityAnalytics {
  accessLogs: Array<{
    date: Date;
    action: string;
    ip: string;
  }>;
  suspiciousActivities: Array<{
    id: string;
    activityType: string;
    details: string;
    timestamp: Date;
    resolved: Date | null;
  }>;
  summary: {
    totalAccess: number;
    uniqueIps: number;
    suspiciousCount: number;
  };
}

export interface VideoSecurityAnalyticsProps {
  userId: string;
  isAdmin?: boolean;
}

export interface VideoProgressSummary {
  videoId: string;
  title: string;
  duration: number | null;
  watchedDuration: number;
  progressPercentage: number;
  isCompleted: boolean;
  lastWatchedAt: Date | null;
}

export interface CourseProgressSummary {
  courseId: string;
  courseTitle: string;
  totalVideos: number;
  completedVideos: number;
  totalDuration: number; // Total course duration in seconds
  watchedDuration: number; // Total watched duration across all videos
  progressPercentage: number; // Overall course completion percentage
  videosProgress: VideoProgressSummary[];
  lastActivityAt: Date | null;
  estimatedTimeRemaining: number; // In seconds
}

export interface UserProgressOverview {
  userId: string;
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalWatchTime: number; // In seconds
  coursesProgress: CourseProgressSummary[];
}

export interface VideoProgressUpdate {
  userId: string;
  videoId: string;
  courseId: string;
  watchedDuration: number;
  totalDuration: number;
  currentTime: number;
  sessionId?: string;
  timestamp?: Date;
}

export interface ProgressAnalytics {
  totalVideosWatched: number;
  totalWatchTime: number;
  averageSessionDuration: number;
  completionRate: number;
  engagementScore: number;
  favoriteTimeOfDay: string;
  weeklyProgress: Array<{
    week: string;
    videosWatched: number;
    totalTime: number;
  }>;
}

export interface MilestoneData {
  type: string;
  percentage: number;
  videoId?: string;
  courseId?: string;
  metadata?: any;
}

export interface VideoAccessInfo {
  video: TransformedVideo;
  isUnlocked: boolean;
  canPreview: boolean;
  unlockReason?: string;
  unlockDate?: Date;
}

export interface CourseVideoAccess {
  course: {
    id: string;
    title: string;
    progressiveUnlock?: {
      enabled: boolean;
      showLockedVideos: boolean;
      allowPreview: boolean;
    };
  };
  videos: VideoAccessInfo[];
}
