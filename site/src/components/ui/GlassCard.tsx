import { cn } from "@/lib/utils/utils";
import { GlassCardProps } from "@/types";

export function GlassCard({
  children,
  className,
  padding = "md",
  rounded = "2xl",
}: GlassCardProps) {
  const paddingClasses = {
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  };

  const roundedClasses = {
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  };

  return (
    <div
      className={cn(
        "bg-white/5 backdrop-blur-sm border border-white/10",
        paddingClasses[padding],
        roundedClasses[rounded],
        className
      )}
    >
      {children}
    </div>
  );
}
