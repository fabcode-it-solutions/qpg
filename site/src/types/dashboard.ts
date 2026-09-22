import { Course, UserSubscription, CourseProgress } from './course';

export interface DashboardData {
  subscriptions: UserSubscription[];
  courses: Course[];
  progress: Record<string, CourseProgress>;
}

export interface UserProgressOverview {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalWatchTime: number;
  coursesProgress: CourseProgressSummary[];
}

export interface CourseProgressSummary {
  courseId: string;
  courseTitle: string;
  progressPercentage: number;
  completedVideos: number;
  totalVideos: number;
  lastActivityAt: Date | null;
  estimatedTimeRemaining?: number;
}

export interface DashboardStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalWatchTime: number;
}