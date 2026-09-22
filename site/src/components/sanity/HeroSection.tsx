import React from "react";
import Link from "next/link";
import HeroImageGrid from "./HeroImageGrid";
import type { HeroSectionProps, BackgroundColor } from "@/types/sanity";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import { cn } from "@/lib/utils/utils";

/**
 * Button style mapping for consistent theming
 */
const BUTTON_STYLES = {
  primary: "bg-[#1E7A37] text-white hover:bg-[#166f30] focus:ring-[#1E7A37]",
  outlined:
    "border-2 border-[--color-gold] text-[--color-gold] hover:bg-[--color-gold] hover:text-black focus:ring-[--color-gold]",
  filled:
    "bg-[--color-gold] text-black hover:bg-transparent hover:border-2 hover:border-[--color-gold] hover:text-[--color-gold] focus:ring-[--color-gold]",
} as const;

/**
 * Background color mapping for consistent theming
 */
const BACKGROUND_COLORS: Record<BackgroundColor, string> = {
  white: "bg-white text-gray-900",
  "gray-50": "bg-gray-50 text-gray-900",
  "gray-900": "bg-gray-900 text-white",
  black: "bg-black text-white",
  primary: "bg-[#1E7A37] text-white",
} as const;

/**
 * Default background color
 */
const DEFAULT_BACKGROUND = "bg-black text-white";

const HeroSection: React.FC<HeroSectionProps> = ({
  heading,
  subheading,
  description,
  backgroundImages = [],
  backgroundColor = "black",
  ctaButton,
}) => {
  /**
   * Get button style classes with proper focus states
   */
  const getButtonStyleClasses = (style: string): string => {
    const baseClasses =
      "inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent";
    const styleClasses =
      BUTTON_STYLES[style as keyof typeof BUTTON_STYLES] ||
      BUTTON_STYLES.primary;

    return cn(baseClasses, styleClasses);
  };

  /**
   * Get background color classes
   */
  const getBackgroundColorClasses = (bgColor: BackgroundColor): string => {
    return BACKGROUND_COLORS[bgColor] || DEFAULT_BACKGROUND;
  };

  /**
   * Renders the hero content section
   */
  const renderHeroContent = (): React.ReactNode => {
    const hasContent = heading || subheading || description || ctaButton;

    if (!hasContent) return null;

    return (
      <div className="py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {heading && (
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {heading}
            </h1>
          )}

          {subheading && (
            <h2 className="text-xl md:text-2xl lg:text-3xl mb-6 text-gray-600 font-medium leading-relaxed">
              {subheading}
            </h2>
          )}

          {description && (
            <p className="text-lg md:text-xl mb-8 text-gray-700 max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>
          )}

          {ctaButton && (
            <div className="mt-8">
              <Link
                href={ctaButton.href}
                className={getButtonStyleClasses(ctaButton.style)}
                aria-describedby={description ? "hero-description" : undefined}
              >
                {ctaButton.text}
                <svg
                  className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <section
        className={getBackgroundColorClasses(backgroundColor)}
        aria-labelledby={heading ? "hero-heading" : undefined}
      >
        {/* Hero Images */}
        {backgroundImages.length > 0 && (
          <HeroImageGrid images={backgroundImages} layout="row" className="" />
        )}

        {/* Hero Content */}
        {renderHeroContent()}
      </section>
    </ErrorBoundary>
  );
};

// Set display name for debugging
HeroSection.displayName = "HeroSection";

export default HeroSection;
