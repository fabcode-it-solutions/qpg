import { ReactNode } from "react";
import { cn } from "@/lib/utils/utils";
import { GlassCard } from "./GlassCard";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  valueColor?: "gold" | "green" | "blue" | "purple" | "red";
}

export function StatCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  className,
  valueColor = "gold",
}: StatCardProps) {
  const colorClasses = {
    gold: "text-(--color-gold)",
    green: "text-green-500",
    blue: "text-blue-500",
    purple: "text-purple-500",
    red: "text-red-500",
  };

  return (
    <GlassCard
      className={cn(
        "hover:bg-white/10 transition-colors duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {icon && <div className="text-(--color-gold)">{icon}</div>}
            <h3 className="text-sm font-medium text-white/70">{title}</h3>
          </div>
          <div
            className={cn("text-2xl font-bold mb-1", colorClasses[valueColor])}
          >
            {value}
          </div>
          {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
        </div>

        {trend && (
          <div
            className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-green-500" : "text-red-500"
            )}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </div>
        )}
      </div>
    </GlassCard>
  );
}
