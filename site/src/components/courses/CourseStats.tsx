import { Clock, Trophy, BookOpen } from "lucide-react";

interface CourseStatsProps {
  completedVideos: number;
  totalVideos: number;
  totalWatchTime: number;
  lastActivityAt?: Date | null;
}

export function CourseStats({
  completedVideos,
  totalVideos,
  totalWatchTime,
  lastActivityAt,
}: CourseStatsProps) {
  const formatWatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
        <div className="w-10 h-10 rounded-full bg-(--color-gold)/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-(--color-gold)" />
        </div>
        <div>
          <p className="text-white font-medium text-left">Lessons Completed</p>
          <p className="text-white/60 text-sm text-left">
            {completedVideos} of {totalVideos}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-white font-medium">Watch Time</p>
          <p className="text-white/60 text-sm text-left">
            {formatWatchTime(totalWatchTime)}
          </p>
        </div>
      </div>

      {lastActivityAt && (
        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-white font-medium">Last Activity</p>
            <p className="text-white/60 text-sm text-left">
              {formatLastActivity(lastActivityAt)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
