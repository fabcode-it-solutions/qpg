export interface VideoProgress {
  videoId: string;
  courseId: string;
  watchedDuration: number;
  totalDuration: number;
  progressPercentage: number;
  isCompleted: boolean;
  lastWatchedAt: Date;
  milestones: Set<number>; // 25, 50, 75, 100
}

export interface CourseProgress {
  courseId: string;
  totalVideos: number;
  completedVideos: number;
  totalDuration: number;
  watchedDuration: number;
  progressPercentage: number;
  lastActivityAt: Date;
}

export interface VideoProgressState {
  // State
  videoProgress: Map<string, VideoProgress>;
  courseProgress: Map<string, CourseProgress>;
  currentlyWatching: string | null;
  isTracking: boolean;
  
  // Actions
  initializeVideo: (videoId: string, courseId: string, initialData?: Partial<VideoProgress>) => void;
  updateVideoProgress: (videoId: string, currentTime: number, totalDuration: number) => void;
  markVideoCompleted: (videoId: string) => void;
  startTracking: (videoId: string) => void;
  stopTracking: () => void;
  saveProgressToServer: (videoId: string) => Promise<void>;
  calculateCourseProgress: (courseId: string, courseVideos: Array<{id: string, duration: number}>) => void;
  
  // Getters
  getVideoProgress: (videoId: string) => VideoProgress | null;
  getCourseProgress: (courseId: string) => CourseProgress | null;
  getVideoProgressPercentage: (videoId: string) => number;
  isVideoCompleted: (videoId: string) => boolean;
}

export interface UseVideoProgressTrackingProps {
  videoId: string;
  courseId: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  hasAccess: boolean;
  initialProgress?: {
    watchedDuration: number;
    totalDuration: number;
    isCompleted: boolean;
  };
}

export interface UseVideoProgressTrackingReturn {
  handlePlay: () => void;
  handlePause: () => void;
  handleSeek: () => void;
  handleEnded: () => void;
  getProgress: () => VideoProgress | null;
  getProgressPercentage: () => number;
  isCompleted: () => boolean;
}

export interface UseCourseProgressTrackingProps {
  courseId: string;
  courseVideos: Array<{
    id: string;
    duration: number;
  }>;
}

export interface UseCourseProgressTrackingReturn {
  courseProgress: CourseProgress | null;
  refreshProgress: () => void;
  getNextVideo: () => string | null;
  getPreviousVideo: () => string | null;
  getCompletionPercentage: () => number;
}