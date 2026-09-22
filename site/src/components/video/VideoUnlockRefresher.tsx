"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface VideoUnlockRefresherProps {
  courseId: string;
}

/**
 * Client component that listens for video completion events
 * and refreshes the page to update video unlock status
 */
export default function VideoUnlockRefresher({ courseId }: VideoUnlockRefresherProps) {
  const router = useRouter();

  useEffect(() => {
    const handleVideoCompleted = (event: CustomEvent) => {
      const { videoId, courseId: completedCourseId } = event.detail;
      
      // Only refresh if the completed video is from the same course
      if (completedCourseId === courseId) {
        console.log(`[VideoUnlockRefresher] Video ${videoId} completed in course ${courseId}, refreshing page to update unlock status`);
        
        // Small delay to ensure all async operations complete
        setTimeout(() => {
          router.refresh();
        }, 1500);
      }
    };

    // Listen for video completion events
    window.addEventListener('videoCompleted', handleVideoCompleted as EventListener);

    return () => {
      window.removeEventListener('videoCompleted', handleVideoCompleted as EventListener);
    };
  }, [courseId, router]);

  // This component doesn't render anything visible
  return null;
}