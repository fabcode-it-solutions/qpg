import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils/utils";
import { FeatureGridProps, Feature } from "@/types";

export function FeatureGrid({
  features,
  className,
  columns = 3,
}: FeatureGridProps) {
  const gridClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-6", gridClasses[columns], className)}>
      {features.map((feature, index) => (
        <FeatureCard key={index} feature={feature} index={index} />
      ))}
    </div>
  );
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  return (
    <GlassCard
      className={cn(
        "group hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl",
        feature.highlight && "ring-2 ring-(--color-gold) ring-opacity-50"
      )}
      padding="lg"
    >
      {/* Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-(--color-gold)/20 to-(--color-gold)/10 border border-(--color-gold)/20 group-hover:from-(--color-gold)/30 group-hover:to-(--color-gold)/20 transition-all duration-300">
          {feature.icon}
        </div>
      </div>

      {/* Content */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-(--color-gold) transition-colors duration-300">
          {feature.title}
        </h3>
        <p className="text-gray-300 leading-relaxed">{feature.description}</p>
      </div>

      {/* Animation delay for staggered effect */}
      <div className="hidden"></div>
    </GlassCard>
  );
}
