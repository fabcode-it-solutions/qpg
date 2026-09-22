"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useMilestoneAccess } from "@/hooks/useMilestoneAccess";
import { formatDuration } from "@/hooks/useCourseProgress";
import {
  Clock,
  Lock,
  PlayCircle,
  Calendar,
  Trophy,
  Eye,
  Unlock,
} from "lucide-react";
import { SpinnerIcon } from "@/components/icons";
import { CourseMilestonesProps } from "@/types";

export function CourseMilestones({
  courseId,
  courseSlug,
}: CourseMilestonesProps) {
  const router = useRouter();
  const [navigatingVideoId, setNavigatingVideoId] = React.useState<
    string | null
  >(null);
  const { data, isLoading, error } = useMilestoneAccess(courseId);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 sm:space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/5 rounded-xl sm:rounded-2xl h-24 sm:h-32"
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4">
        <p className="text-red-400 text-sm sm:text-base">
          Failed to load course content
        </p>
      </div>
    );
  }

  const handleVideoClick = (
    videoId: string,
    isUnlocked: boolean,
    canPreview: boolean
  ) => {
    if (isUnlocked || canPreview) {
      setNavigatingVideoId(videoId);
      router.push(`/courses/${courseId}/videos/${videoId}`);
    }
  };

  const getUnlockIcon = (unlockType?: string) => {
    switch (unlockType) {
      case "immediate":
        return <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />;
      case "after_days":
        return <Calendar className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />;
      case "after_completion":
        return <Trophy className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />;
      default:
        return <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />;
    }
  };

  const getUnlockTypeLabel = (
    unlockType?: string,
    unlockAfterDays?: number
  ) => {
    switch (unlockType) {
      case "immediate":
        return "Available immediately";
      case "after_days":
        return `Unlocks after ${unlockAfterDays || 0} days`;
      case "after_completion":
        return "Unlocks after previous video";
      default:
        return "Available immediately";
    }
  };

  const showLockedVideos =
    data.course.progressiveUnlock?.showLockedVideos ?? true;
  const progressiveUnlockEnabled =
    data.course.progressiveUnlock?.enabled ?? false;

  // Group videos by unlock type for better organization
  const immediateVideos = data.videos.filter(
    (v) => !v.unlockSettings || v.unlockSettings.unlockType === "immediate"
  );
  const timeBasedVideos = data.videos.filter(
    (v) => v.unlockSettings?.unlockType === "after_days"
  );
  const completionBasedVideos = data.videos.filter(
    (v) => v.unlockSettings?.unlockType === "after_completion"
  );

  const renderVideoGroup = (
    videos: typeof data.videos,
    groupTitle: string,
    groupIcon: React.ReactNode
  ) => {
    if (videos.length === 0) return null;

    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-6 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-(--color-gold)/20 text-(--color-gold)">
              {groupIcon}
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">
              {groupTitle}
            </h3>
            <span className="text-[11px] sm:text-sm text-white/60">
              ({videos.length} videos)
            </span>
          </div>
        </div>

        <div className="divide-y divide-white/10">
          {videos.map((video, index) => {
            const shouldShow = video.isUnlocked || showLockedVideos;

            if (!shouldShow) return null;

            return (
              <button
                key={video.id}
                onClick={() =>
                  handleVideoClick(video.id, video.isUnlocked, video.canPreview)
                }
                disabled={!video.isUnlocked && !video.canPreview}
                className={`w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 flex items-center justify-between hover:bg-white/5 transition-colors group ${
                  !video.isUnlocked && !video.canPreview
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 ${
                      video.isUnlocked
                        ? "bg-(--color-gold)/20 text-(--color-gold)"
                        : video.canPreview
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {video.order || index + 1}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="font-medium text-white group-hover:text-(--color-gold) transition-colors text-sm sm:text-base truncate">
                      {video.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 lg:gap-3 mt-1 sm:mt-2">
                      {video.duration && (
                        <span className="text-xs text-white/60 flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {formatDuration(video.duration)}
                        </span>
                      )}
                      {video.isFree && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-green-500/30 flex-shrink-0">
                          Free
                        </span>
                      )}
                      {progressiveUnlockEnabled && video.unlockSettings && (
                        <span className="text-xs bg-(--color-gold)/20 text-(--color-gold) px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-(--color-gold)/30 flex items-center gap-1 flex-shrink-0">
                          {getUnlockIcon(video.unlockSettings.unlockType)}
                          <span className="hidden sm:inline">
                            {getUnlockTypeLabel(
                              video.unlockSettings.unlockType,
                              video.unlockSettings.unlockAfterDays
                            )}
                          </span>
                        </span>
                      )}
                      {!video.isUnlocked && video.canPreview && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border border-yellow-500/30 flex items-center gap-1 flex-shrink-0">
                          <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span className="hidden sm:inline">
                            Preview Available
                          </span>
                        </span>
                      )}
                    </div>
                    {!video.isUnlocked && video.unlockReason && (
                      <p className="text-xs text-white/50 mt-1 sm:mt-2 truncate">
                        {video.unlockReason}
                        {video.unlockDate &&
                          ` - Unlocks on ${new Date(
                            video.unlockDate
                          ).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {navigatingVideoId === video.id ? (
                    <SpinnerIcon
                      size={16}
                      className="text-(--color-gold) sm:w-5 sm:h-5"
                    />
                  ) : video.isUnlocked ? (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 hidden sm:block" />
                      <PlayCircle className="w-4 h-4 sm:w-5 sm:h-5 text-(--color-gold)" />
                    </div>
                  ) : video.canPreview ? (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                  ) : (
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Course Info */}
      {progressiveUnlockEnabled && (
        <div className="bg-(--color-gold)/10 border border-(--color-gold)/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-(--color-gold) mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-(--color-gold) mb-1 sm:mb-2 text-sm sm:text-base">
                Progressive Content Unlocking
              </h3>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Videos in this course unlock based on time and completion rules.
                {data.course.progressiveUnlock?.allowPreview &&
                  " Preview mode is available for locked content."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Immediate Access Videos */}
      {renderVideoGroup(
        immediateVideos,
        "Available Now",
        <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4" />
      )}

      {/* Time-based Videos */}
      {renderVideoGroup(
        timeBasedVideos,
        "Time-based Unlock",
        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
      )}

      {/* Completion-based Videos */}
      {renderVideoGroup(
        completionBasedVideos,
        "Completion-based Unlock",
        <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
      )}

      {/* Empty state */}
      {data.videos.length === 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
            <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white/50" />
          </div>
          <p className="text-white/70 text-base sm:text-lg">
            No videos available for this course yet
          </p>
        </div>
      )}
    </div>
  );
}
