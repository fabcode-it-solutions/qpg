"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { CourseProgressData, VideoProgressItem } from "@/types";

export interface DetailedCourseProgress extends CourseProgressData {
  courseTitle: string;
  videosProgress: VideoProgressItem[];
}

export function useCourseProgress(courseId: string) {
  const { data: session } = useSession();

  // Memoize initial state to prevent recreation
  const initialProgress = useMemo(
    () => ({
      courseId,
      progressPercentage: 0,
      completedVideos: 0,
      totalVideos: 0,
      totalDuration: 0,
      watchedDuration: 0,
      lastActivityAt: null,
      estimatedTimeRemaining: 0,
      isLoading: true,
      error: null,
    }),
    [courseId]
  );

  const [progress, setProgress] = useState<CourseProgressData>(initialProgress);

  const fetchProgress = useCallback(async () => {
    if (!session?.user?.id || !courseId) {
      setProgress((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setProgress((prev) => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/courses/${courseId}/progress-summary`);

      if (!response.ok) {
        throw new Error("Failed to fetch progress");
      }

      const data = await response.json();

      if (data.success && data.progress) {
        setProgress({
          courseId,
          progressPercentage: data.progress.progressPercentage || 0,
          completedVideos: data.progress.completedVideos || 0,
          totalVideos: data.progress.totalVideos || 0,
          totalDuration: data.progress.totalDuration || 0,
          watchedDuration: data.progress.watchedDuration || 0,
          lastActivityAt: data.progress.lastActivityAt
            ? new Date(data.progress.lastActivityAt)
            : null,
          estimatedTimeRemaining: data.progress.estimatedTimeRemaining || 0,
          isLoading: false,
          error: null,
        });
      } else {
        setProgress((prev) => ({
          ...prev,
          isLoading: false,
          error: data.error || "Failed to load progress",
        }));
      }
    } catch (error) {
      console.error("Error fetching course progress:", error);
      setProgress((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load progress",
      }));
    }
  }, [session?.user?.id, courseId]);

  // Auto-refresh progress
  const refreshProgress = useCallback(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Initial load
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Listen for progress updates from other components
  useEffect(() => {
    const handleProgressUpdate = (event: CustomEvent) => {
      if (event.detail.courseId === courseId) {
        refreshProgress();
      }
    };

    window.addEventListener(
      "courseProgressUpdate",
      handleProgressUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "courseProgressUpdate",
        handleProgressUpdate as EventListener
      );
    };
  }, [courseId, refreshProgress]);

  return {
    progress,
    refreshProgress,
    isLoading: progress.isLoading,
    error: progress.error,
  };
}

export function useDetailedCourseProgress(courseId: string) {
  const { data: session } = useSession();
  const [detailedProgress, setDetailedProgress] =
    useState<DetailedCourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetailedProgress = useCallback(async () => {
    if (!session?.user?.id || !courseId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/courses/${courseId}/detailed-progress`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch detailed progress");
      }

      const data = await response.json();

      if (data.success && data.progress) {
        setDetailedProgress({
          courseId,
          courseTitle: data.progress.courseTitle,
          progressPercentage: data.progress.progressPercentage || 0,
          completedVideos: data.progress.completedVideos || 0,
          totalVideos: data.progress.totalVideos || 0,
          totalDuration: data.progress.totalDuration || 0,
          watchedDuration: data.progress.watchedDuration || 0,
          lastActivityAt: data.progress.lastActivityAt
            ? new Date(data.progress.lastActivityAt)
            : null,
          estimatedTimeRemaining: data.progress.estimatedTimeRemaining || 0,
          videosProgress: data.progress.videosProgress || [],
          isLoading: false,
          error: null,
        });
      } else {
        setError(data.error || "Failed to load detailed progress");
      }
    } catch (err) {
      console.error("Error fetching detailed course progress:", err);
      setError("Failed to load detailed progress");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, courseId]);

  // Refresh function
  const refreshDetailedProgress = useCallback(() => {
    fetchDetailedProgress();
  }, [fetchDetailedProgress]);

  // Initial load
  useEffect(() => {
    fetchDetailedProgress();
  }, [fetchDetailedProgress]);

  return {
    detailedProgress,
    refreshDetailedProgress,
    isLoading,
    error,
  };
}

export function useUserProgressOverview() {
  const { data: session } = useSession();
  const [overview, setOverview] = useState<{
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    totalWatchTime: number;
    coursesProgress: Array<{
      courseId: string;
      courseTitle: string;
      progressPercentage: number;
      completedVideos: number;
      totalVideos: number;
      lastActivityAt: Date | null;
    }>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/user/progress-overview");

      if (!response.ok) {
        throw new Error("Failed to fetch progress overview");
      }

      const data = await response.json();

      if (data.success && data.overview) {
        setOverview({
          totalCourses: data.overview.totalCourses || 0,
          completedCourses: data.overview.completedCourses || 0,
          inProgressCourses: data.overview.inProgressCourses || 0,
          totalWatchTime: data.overview.totalWatchTime || 0,
          coursesProgress: (data.overview.coursesProgress || []).map(
            (course: any) => ({
              courseId: course.courseId,
              courseTitle: course.courseTitle,
              progressPercentage: course.progressPercentage || 0,
              completedVideos: course.completedVideos || 0,
              totalVideos: course.totalVideos || 0,
              lastActivityAt: course.lastActivityAt
                ? new Date(course.lastActivityAt)
                : null,
            })
          ),
        });
      } else {
        setError(data.error || "Failed to load progress overview");
      }
    } catch (err) {
      console.error("Error fetching user progress overview:", err);
      setError("Failed to load progress overview");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Refresh function
  const refreshOverview = useCallback(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Initial load
  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Listen for any course progress updates
  useEffect(() => {
    const handleProgressUpdate = () => {
      // Debounce the refresh to avoid too many calls
      setTimeout(() => {
        refreshOverview();
      }, 1000);
    };

    window.addEventListener("courseProgressUpdate", handleProgressUpdate);

    return () => {
      window.removeEventListener("courseProgressUpdate", handleProgressUpdate);
    };
  }, [refreshOverview]);

  return {
    overview,
    refreshOverview,
    isLoading,
    error,
  };
}

// Utility function to trigger progress update events
export function triggerCourseProgressUpdate(courseId: string) {
  window.dispatchEvent(
    new CustomEvent("courseProgressUpdate", {
      detail: { courseId },
    })
  );
}

// Utility function to format time duration
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

// Utility function to get progress color
export function getProgressColor(percentage: number): string {
  if (percentage >= 90) return "text-green-600";
  if (percentage >= 50) return "text-blue-600";
  if (percentage > 0) return "text-yellow-600";
  return "text-gray-400";
}

// Utility function to get progress background color
export function getProgressBackgroundColor(percentage: number): string {
  if (percentage >= 90) return "bg-green-600";
  if (percentage >= 50) return "bg-blue-600";
  if (percentage > 0) return "bg-yellow-600";
  return "bg-gray-400";
}
