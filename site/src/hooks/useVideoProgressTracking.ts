import { useEffect, useRef, useCallback } from 'react';
import { useVideoProgressStore } from '@/stores/video-progress.store';
import { UseVideoProgressTrackingProps, UseVideoProgressTrackingReturn } from '@/types/video-progress';

export function useVideoProgressTracking({
  videoId,
  courseId,
  videoRef,
  hasAccess,
  initialProgress,
}: UseVideoProgressTrackingProps): UseVideoProgressTrackingReturn {
  const {
    initializeVideo,
    updateVideoProgress,
    markVideoCompleted,
    startTracking,
    stopTracking,
    getVideoProgress,
    getVideoProgressPercentage,
    isVideoCompleted,
    saveProgressToServer,
  } = useVideoProgressStore();

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const hasInitializedRef = useRef(false);

  // Initialize video progress
  useEffect(() => {
    if (!hasAccess || hasInitializedRef.current) return;
    
    initializeVideo(videoId, courseId, {
      watchedDuration: initialProgress?.watchedDuration || 0,
      totalDuration: initialProgress?.totalDuration || 0,
      isCompleted: initialProgress?.isCompleted || false,
      progressPercentage: initialProgress?.totalDuration 
        ? Math.round(((initialProgress.watchedDuration || 0) / initialProgress.totalDuration) * 100)
        : 0,
    });
    
    hasInitializedRef.current = true;
  }, [videoId, courseId, hasAccess, initialProgress, initializeVideo]);

  // Resume from last position
  useEffect(() => {
    if (!videoRef.current || !hasAccess) return;
    
    const progress = getVideoProgress(videoId);
    if (progress && progress.watchedDuration > 0) {
      videoRef.current.currentTime = progress.watchedDuration;
    }
  }, [videoId, hasAccess, getVideoProgress]);

  // Handle play event
  const handlePlay = useCallback(() => {
    if (!hasAccess) return;
    
    startTracking(videoId);
    
    // Start progress tracking interval
    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration || 0;
        
        updateVideoProgress(videoId, currentTime, duration);
        
        // Save to server every 30 seconds
        const now = Date.now();
        if (now - lastSaveTimeRef.current > 30000) {
          saveProgressToServer(videoId);
          lastSaveTimeRef.current = now;
        }
      }
    }, 1000); // Update every second
  }, [videoId, hasAccess, startTracking, updateVideoProgress, saveProgressToServer]);

  // Handle pause event
  const handlePause = useCallback(() => {
    if (!hasAccess) return;
    
    stopTracking();
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    // Update progress on pause
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration || 0;
      updateVideoProgress(videoId, currentTime, duration);
      saveProgressToServer(videoId);
    }
  }, [videoId, hasAccess, stopTracking, updateVideoProgress, saveProgressToServer]);

  // Handle seek event
  const handleSeek = useCallback(() => {
    if (!hasAccess || !videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 0;
    updateVideoProgress(videoId, currentTime, duration);
  }, [videoId, hasAccess, updateVideoProgress]);

  // Handle video end
  const handleEnded = useCallback(() => {
    if (!hasAccess) return;
    
    markVideoCompleted(videoId);
    stopTracking();
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, [videoId, hasAccess, markVideoCompleted, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      stopTracking();
    };
  }, [stopTracking]);

  // Handle visibility change (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handlePause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handlePause]);

  return {
    handlePlay,
    handlePause,
    handleSeek,
    handleEnded,
    getProgress: () => getVideoProgress(videoId),
    getProgressPercentage: () => getVideoProgressPercentage(videoId),
    isCompleted: () => isVideoCompleted(videoId),
  };
}