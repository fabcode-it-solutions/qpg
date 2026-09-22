import { cn } from "@/lib/utils/utils";
import { ContentSectionProps } from "@/types";

export function ContentSection({
  title,
  subtitle,
  children,
  className,
  background = "default",
  centerText = false,
  maxWidth = "2xl",
}: ContentSectionProps) {
  const backgroundClasses = {
    default: "",
    subtle: "bg-white/5",
    gradient: "bg-gradient-to-br from-white/5 to-transparent",
  };

  const maxWidthClasses = {
    sm: "max-w-2xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
    "2xl": "max-w-7xl",
    full: "max-w-none",
  };

  const textAlignClasses = centerText ? "text-center" : "";

  return (
    <section
      className={cn("py-16 lg:py-24", backgroundClasses[background], className)}
    >
      <div
        className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8",
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Header */}
        {(title || subtitle) && (
          <div className={cn("mb-12 lg:mb-16", textAlignClasses)}>
            {title && (
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {title}
                </span>
              </h2>
            )}

            {subtitle && (
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Content */}
        <div>{children}</div>
      </div>
    </section>
  );
}
