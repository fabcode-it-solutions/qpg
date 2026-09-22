import { useEffect } from "react";
import { useVideoProgressStore } from "@/stores/video-progress.store";

interface Video {
  id: string;
  title: string;
  duration: number;
}

interface Course {
  id: string;
  title: string;
  videos: Video[];
}

interface UseCourseProgressTrackingProps {
  course: Course;
  userProgress?: Array<{
    videoId: string;
    watchedDuration: number;
    totalDuration: number;
    isCompleted: boolean;
  }>;
}

export function useCourseProgressTracking({
  course,
  userProgress = [],
}: UseCourseProgressTrackingProps) {
  const {
    initializeVideo,
    calculateCourseProgress,
    getCourseProgress,
    getVideoProgress,
    isVideoCompleted,
  } = useVideoProgressStore();

  // Initialize all videos in the course
  useEffect(() => {
    course.videos.forEach((video) => {
      const existingProgress = userProgress.find((p) => p.videoId === video.id);

      initializeVideo(video.id, course.id, {
        watchedDuration: existingProgress?.watchedDuration || 0,
        totalDuration: existingProgress?.totalDuration || video.duration,
        isCompleted: existingProgress?.isCompleted || false,
        progressPercentage: existingProgress?.totalDuration
          ? Math.round(
              ((existingProgress.watchedDuration || 0) /
                existingProgress.totalDuration) *
                100
            )
          : 0,
      });
    });

    // Calculate initial course progress
    calculateCourseProgress(course.id, course.videos);
  }, [course, userProgress, initializeVideo, calculateCourseProgress]);

  // Recalculate course progress when any video progress changes
  useEffect(() => {
    const unsubscribe = useVideoProgressStore.subscribe(
      (state) => state.videoProgress,
      () => {
        calculateCourseProgress(course.id, course.videos);
      }
    );

    return unsubscribe;
  }, [course.id, course.videos, calculateCourseProgress]);

  // Get course completion percentage
  const getCourseCompletionPercentage = () => {
    const courseProgress = getCourseProgress(course.id);
    return courseProgress?.progressPercentage || 0;
  };

  // Get completed videos count
  const getCompletedVideosCount = () => {
    return course.videos.filter((video) => isVideoCompleted(video.id)).length;
  };

  // Get total watch time for course
  const getTotalWatchTime = () => {
    return course.videos.reduce((total, video) => {
      const progress = getVideoProgress(video.id);
      return total + (progress?.watchedDuration || 0);
    }, 0);
  };

  // Get estimated time remaining
  const getEstimatedTimeRemaining = () => {
    const totalDuration = course.videos.reduce(
      (total, video) => total + video.duration,
      0
    );
    const watchedDuration = getTotalWatchTime();
    return Math.max(0, totalDuration - watchedDuration);
  };

  // Check if course is completed
  const isCourseCompleted = () => {
    return course.videos.every((video) => isVideoCompleted(video.id));
  };

  // Get next video to watch
  const getNextVideo = () => {
    return course.videos.find((video) => !isVideoCompleted(video.id));
  };

  // Get video progress summary
  const getVideoProgressSummary = () => {
    return course.videos.map((video) => {
      const progress = getVideoProgress(video.id);
      return {
        videoId: video.id,
        title: video.title,
        duration: video.duration,
        watchedDuration: progress?.watchedDuration || 0,
        progressPercentage: progress?.progressPercentage || 0,
        isCompleted: progress?.isCompleted || false,
        lastWatchedAt: progress?.lastWatchedAt || null,
      };
    });
  };

  return {
    courseProgress: getCourseProgress(course.id),
    getCourseCompletionPercentage,
    getCompletedVideosCount,
    getTotalWatchTime,
    getEstimatedTimeRemaining,
    isCourseCompleted,
    getNextVideo,
    getVideoProgressSummary,
  };
}
