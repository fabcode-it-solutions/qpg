"use client";

import { useCourseProgressTracking } from '@/hooks/useCourseProgressTracking';
import { CheckCircleIcon, PlayCustomIcon, CourseClockIcon } from '@/components/icons';
import { GlassCard } from '@/components/ui/GlassCard';

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

interface CourseProgressTrackerProps {
  course: Course;
  userProgress?: Array<{
    videoId: string;
    watchedDuration: number;
    totalDuration: number;
    isCompleted: boolean;
  }>;
  onVideoSelect?: (videoId: string) => void;
}

export default function CourseProgressTracker({
  course,
  userProgress,
  onVideoSelect,
}: CourseProgressTrackerProps) {
  const {
    getCourseCompletionPercentage,
    getCompletedVideosCount,
    getTotalWatchTime,
    getEstimatedTimeRemaining,
    isCourseCompleted,
    getNextVideo,
    getVideoProgressSummary,
  } = useCourseProgressTracking({ course, userProgress });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const completionPercentage = getCourseCompletionPercentage();
  const completedVideos = getCompletedVideosCount();
  const totalVideos = course.videos.length;
  const totalWatchTime = getTotalWatchTime();
  const estimatedTimeRemaining = getEstimatedTimeRemaining();
  const nextVideo = getNextVideo();
  const videoProgressSummary = getVideoProgressSummary();

  return (
    <div className="space-y-6">
      {/* Course Progress Overview */}
      <GlassCard padding="lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Course Progress</h2>
          {isCourseCompleted() && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
              <CheckCircleIcon className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Completed</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70">Overall Progress</span>
            <span className="text-sm font-medium text-white">{completionPercentage}%</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${completionPercentage}%`,
                background: completionPercentage === 100
                  ? 'linear-gradient(90deg, #10b981, #059669)'
                  : 'linear-gradient(90deg, var(--color-gold), #f59e0b)',
              }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-(--color-gold) mb-1">
              {completedVideos}
            </div>
            <div className="text-xs text-white/60">
              of {totalVideos} videos
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-(--color-gold) mb-1">
              {formatTime(totalWatchTime)}
            </div>
            <div className="text-xs text-white/60">watched</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-(--color-gold) mb-1">
              {formatTime(estimatedTimeRemaining)}
            </div>
            <div className="text-xs text-white/60">remaining</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-(--color-gold) mb-1">
              {completionPercentage}%
            </div>
            <div className="text-xs text-white/60">complete</div>
          </div>
        </div>

        {/* Next Video */}
        {nextVideo && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white mb-1">Continue Learning</h3>
                <p className="text-sm text-white/70">{nextVideo.title}</p>
              </div>
              <button
                onClick={() => onVideoSelect?.(nextVideo.id)}
                className="flex items-center gap-2 px-4 py-2 bg-(--color-gold) text-black rounded-lg hover:bg-(--color-gold)/90 transition-colors"
              >
                <PlayCustomIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Continue</span>
              </button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Video Progress List */}
      <GlassCard padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Video Progress</h3>
        <div className="space-y-3">
          {videoProgressSummary.map((video, index) => (
            <div
              key={video.videoId}
              className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
              onClick={() => onVideoSelect?.(video.videoId)}
            >
              {/* Video Number */}
              <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                {video.isCompleted ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                ) : (
                  <span className="text-sm font-medium text-white/70">{index + 1}</span>
                )}
              </div>

              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate mb-1">
                  {video.title}
                </h4>
                <div className="flex items-center gap-4 text-xs text-white/60">
                  <div className="flex items-center gap-1">
                    <CourseClockIcon className="w-3 h-3" />
                    <span>{formatTime(video.duration)}</span>
                  </div>
                  <span>{video.progressPercentage}% watched</span>
                  {video.lastWatchedAt && (
                    <span>
                      Last: {new Date(video.lastWatchedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex-shrink-0 w-24">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${video.progressPercentage}%`,
                      background: video.isCompleted
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, var(--color-gold), #f59e0b)',
                    }}
                  />
                </div>
              </div>

              {/* Play Button */}
              <button className="flex-shrink-0 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <PlayCustomIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}