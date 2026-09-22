import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  CourseVideoData,
  UseCourseVideoAccessReturn,
  VideoAccessInfo,
} from "@/types/course";

/**
 * React hook for managing course video access with simplified unlock rules
 */
export function useCourseVideoAccess(
  courseId: string
): UseCourseVideoAccessReturn {
  const { data: session } = useSession();
  const [data, setData] = useState<CourseVideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCourseVideoData = useCallback(async () => {
    if (!session?.user || !courseId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/courses/${courseId}/milestones`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch course video data");
      }

      const videoData: CourseVideoData = await response.json();
      setData(videoData);
    } catch (err) {
      console.error("Error fetching course video data:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [courseId, session]);

  const checkVideoAccess = useCallback(
    async (videoId: string): Promise<VideoAccessInfo | null> => {
      if (!session?.user) {
        return null;
      }

      try {
        const response = await fetch(`/api/videos/${videoId}/access`);

        if (!response.ok) {
          console.error("Failed to check video access");
          return null;
        }

        return await response.json();
      } catch (err) {
        console.error("Error checking video access:", err);
        return null;
      }
    },
    [session]
  );

  useEffect(() => {
    fetchCourseVideoData();
  }, [fetchCourseVideoData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCourseVideoData,
    checkVideoAccess,
  };
}

// Legacy hook name for backward compatibility
export const useMilestoneAccess = useCourseVideoAccess;

/**
 * Helper hook to get a specific video's access status
 */
export function useVideoAccess(videoId: string) {
  const { data: session } = useSession();
  const [accessInfo, setAccessInfo] = useState<VideoAccessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!session?.user || !videoId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/videos/${videoId}/access`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to check video access");
        }

        const data: VideoAccessInfo = await response.json();
        setAccessInfo(data);
      } catch (err) {
        console.error("Error checking video access:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [videoId, session]);

  return {
    accessInfo,
    isLoading,
    error,
    isUnlocked: accessInfo?.access.isUnlocked ?? false,
    canPreview: accessInfo?.access.canPreview ?? false,
    unlockReason: accessInfo?.access.unlockReason,
  };
}
