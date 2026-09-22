import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { VideoProgress, CourseProgress, VideoProgressState } from '@/types/video-progress';

export const useVideoProgressStore = create<VideoProgressState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    videoProgress: new Map(),
    courseProgress: new Map(),
    currentlyWatching: null,
    isTracking: false,

    // Initialize video progress
    initializeVideo: (videoId, courseId, initialData = {}) => {
      const existing = get().videoProgress.get(videoId);
      if (existing) return;

      const progress: VideoProgress = {
        videoId,
        courseId,
        watchedDuration: 0,
        totalDuration: 0,
        progressPercentage: 0,
        isCompleted: false,
        lastWatchedAt: new Date(),
        milestones: new Set(),
        ...initialData,
      };

      set((state) => ({
        videoProgress: new Map(state.videoProgress).set(videoId, progress),
      }));
    },

    // Update video progress
    updateVideoProgress: (videoId, currentTime, totalDuration) => {
      const state = get();
      const existing = state.videoProgress.get(videoId);
      if (!existing || !state.isTracking) return;

      // Professional re-watch detection: Allow rewinding for completed videos
      let watchedDuration = currentTime;
      let isCompleted = existing.isCompleted;
      
      if (existing.isCompleted) {
        // Check if user has significantly rewound from completion
        const rewindThreshold = Math.max(30, totalDuration * 0.05); // 30s or 5% of video
        const isSignificantRewind = currentTime < (existing.watchedDuration - rewindThreshold);
        
        if (isSignificantRewind) {
          // Re-watch detected: reset completion and use current time
          watchedDuration = currentTime;
          isCompleted = false;
          console.log(`🔄 Re-watch detected in store for video ${videoId}: ${currentTime}s (was ${existing.watchedDuration}s)`);
        } else {
          // Normal progression: use higher value
          watchedDuration = Math.max(currentTime, existing.watchedDuration);
        }
      } else {
        // Normal progression for non-completed videos
        watchedDuration = Math.max(currentTime, existing.watchedDuration);
      }

      const progressPercentage = totalDuration > 0 
        ? Math.round((watchedDuration / totalDuration) * 100) 
        : 0;
      
      // Recalculate completion based on current progress
      if (!isCompleted) {
        isCompleted = progressPercentage >= 90;
      }
      
      // Check for new milestones
      const newMilestones = new Set(existing.milestones);
      [25, 50, 75, 100].forEach(milestone => {
        if (progressPercentage >= milestone && !newMilestones.has(milestone)) {
          newMilestones.add(milestone);
        }
      });

      const updatedProgress: VideoProgress = {
        ...existing,
        watchedDuration,
        totalDuration,
        progressPercentage,
        isCompleted,
        lastWatchedAt: new Date(),
        milestones: newMilestones,
      };

      set((state) => ({
        videoProgress: new Map(state.videoProgress).set(videoId, updatedProgress),
      }));

      // Auto-save to server every 30 seconds
      if (Math.floor(currentTime) % 30 === 0) {
        get().saveProgressToServer(videoId);
      }
    },

    // Mark video as completed
    markVideoCompleted: (videoId) => {
      const state = get();
      const existing = state.videoProgress.get(videoId);
      if (!existing) return;

      const updatedProgress: VideoProgress = {
        ...existing,
        isCompleted: true,
        progressPercentage: 100,
        lastWatchedAt: new Date(),
        milestones: new Set([...existing.milestones, 100]),
      };

      set((state) => ({
        videoProgress: new Map(state.videoProgress).set(videoId, updatedProgress),
      }));

      get().saveProgressToServer(videoId);
    },

    // Start tracking
    startTracking: (videoId) => {
      set({ currentlyWatching: videoId, isTracking: true });
    },

    // Stop tracking
    stopTracking: () => {
      const state = get();
      if (state.currentlyWatching) {
        get().saveProgressToServer(state.currentlyWatching);
      }
      set({ currentlyWatching: null, isTracking: false });
    },

    // Save progress to server
    saveProgressToServer: async (videoId) => {
      const progress = get().videoProgress.get(videoId);
      if (!progress) return;

      try {
        await fetch(`/api/courses/${progress.courseId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId: progress.videoId,
            watchedDuration: Math.floor(progress.watchedDuration),
            totalDuration: Math.floor(progress.totalDuration),
            isCompleted: progress.isCompleted,
            progressPercentage: progress.progressPercentage,
          }),
        });
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    },

    // Calculate course progress
    calculateCourseProgress: (courseId, courseVideos) => {
      const state = get();
      const videoProgresses = courseVideos.map(video => 
        state.videoProgress.get(video.id)
      ).filter(Boolean) as VideoProgress[];

      const totalVideos = courseVideos.length;
      const completedVideos = videoProgresses.filter(p => p.isCompleted).length;
      const totalDuration = courseVideos.reduce((sum, video) => sum + video.duration, 0);
      const watchedDuration = videoProgresses.reduce((sum, p) => sum + p.watchedDuration, 0);
      
      const progressPercentage = totalVideos > 0 
        ? Math.round((completedVideos / totalVideos) * 100)
        : 0;

      const courseProgress: CourseProgress = {
        courseId,
        totalVideos,
        completedVideos,
        totalDuration,
        watchedDuration,
        progressPercentage,
        lastActivityAt: new Date(),
      };

      set((state) => ({
        courseProgress: new Map(state.courseProgress).set(courseId, courseProgress),
      }));
    },

    // Getters
    getVideoProgress: (videoId) => get().videoProgress.get(videoId) || null,
    getCourseProgress: (courseId) => get().courseProgress.get(courseId) || null,
    getVideoProgressPercentage: (videoId) => get().videoProgress.get(videoId)?.progressPercentage || 0,
    isVideoCompleted: (videoId) => get().videoProgress.get(videoId)?.isCompleted || false,
  }))
);

// Subscribe to progress changes for persistence
useVideoProgressStore.subscribe(
  (state) => state.videoProgress,
  (videoProgress) => {
    // Save to localStorage for offline access
    try {
      const progressData = Array.from(videoProgress.entries()).map(([id, progress]) => [
        id,
        {
          ...progress,
          milestones: Array.from(progress.milestones),
          lastWatchedAt: progress.lastWatchedAt.toISOString(),
        }
      ]);
      localStorage.setItem('video-progress', JSON.stringify(progressData));
    } catch (error) {
      // Ignore localStorage errors
    }
  }
);

// Load from localStorage on initialization
try {
  const stored = localStorage.getItem('video-progress');
  if (stored) {
    const progressData: Array<[string, any]> = JSON.parse(stored);
    const progressMap = new Map<string, VideoProgress>(
      progressData.map(([id, progress]: [string, any]) => [
        id,
        {
          ...progress,
          milestones: new Set(progress.milestones),
          lastWatchedAt: new Date(progress.lastWatchedAt),
        }
      ])
    );
    useVideoProgressStore.setState({ videoProgress: progressMap });
  }
} catch (error) {
  // Ignore localStorage errors
}