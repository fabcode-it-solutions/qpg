import { cn } from "@/lib/utils/utils";
import { PageHeroProps } from "@/types";

export function PageHero({
  title,
  subtitle,
  description,
  children,
  className,
  backgroundPattern = true,
}: PageHeroProps) {
  return (
    <section
      className={cn("relative py-20 lg:py-32 overflow-hidden", className)}
    >
      {/* Background Pattern */}
      {backgroundPattern && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-(--color-gold) rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-(--color-secondary) rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-(--color-tertiary) rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>
      )}

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {title}
          </span>
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <h2 className="text-xl sm:text-2xl lg:text-3xl text-(--color-gold) font-medium mb-6 leading-relaxed">
            {subtitle}
          </h2>
        )}

        {/* Description */}
        {description && (
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            {description}
          </p>
        )}

        {/* Additional Content */}
        {children}
      </div>
    </section>
  );
}
