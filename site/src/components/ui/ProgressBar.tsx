import { cn } from "@/lib/utils/utils";

interface ProgressBarProps {
  progress: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showPercentage?: boolean;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  className,
  size = "md",
  showPercentage = true,
  animated = true,
}: ProgressBarProps) {
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const getProgressColor = (value: number) => {
    if (value >= 90) return "bg-green-500";
    if (value >= 70) return "bg-(--color-gold)";
    if (value >= 40) return "bg-yellow-500";
    return "bg-blue-500";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {showPercentage && (
        <div className="flex justify-between text-sm">
          <span className="text-white/90">Progress</span>
          <span className="font-medium text-(--color-gold)">{progress}%</span>
        </div>
      )}
      <div className={cn("w-full bg-white/10 rounded-full relative overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "rounded-full transition-all duration-500",
            sizeClasses[size],
            getProgressColor(progress),
            animated && "ease-out"
          )}
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          {progress >= 90 && animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 animate-pulse"></div>
          )}
        </div>
      </div>
    </div>
  );
}