"use client";

import { CourseProgress, CourseProgressBarProps } from "@/types/course";
import { useEffect, useState } from "react";

export default function CourseProgressBar({
  courseId,
  initialProgress,
}: CourseProgressBarProps) {
  const [progress, setProgress] = useState<CourseProgress | null>(
    initialProgress || null
  );
  const [isLoading, setIsLoading] = useState(!initialProgress);

  useEffect(() => {
    if (!initialProgress) {
      fetchProgress();
    }
  }, [courseId, initialProgress]);

  const fetchProgress = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/courses/${courseId}/progress`);

      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress);
      }
    } catch (error) {
      console.error("Error fetching course progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white/20 rounded-full h-3 mb-4">
        <div className="bg-white/40 h-3 rounded-full animate-pulse w-1/3"></div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <div className="course-progress">
      <div className="flex justify-between mb-3">
        <span className="text-sm font-medium text-white">Course Progress</span>
        <span className="text-sm font-medium text-(--color-gold)">
          {progress.completedVideos} of {progress.totalVideos} lessons completed
        </span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-3 mb-4 overflow-hidden">
        <div
          className="bg-(--color-gold) h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress.progressPercentage}%` }}
        ></div>
      </div>
      <p className="text-sm text-white/70">
        {progress.progressPercentage}% complete
      </p>
    </div>
  );
}
