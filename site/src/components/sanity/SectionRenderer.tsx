import React from "react";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { getImageUrl } from "@/lib/sanity/client";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import HeroSection from "./HeroSection";
import FeaturesSection from "./FeaturesSection";
import VideosSection from "./VideosSection";
import type { SectionRendererProps, BackgroundColor } from "@/types/sanity";
import { cn } from "@/lib/utils/utils";

/**
 * Background color mapping for consistent theming
 */
const BACKGROUND_COLORS: Record<string, string> = {
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

const SectionRenderer: React.FC<SectionRendererProps> = ({ section }) => {
  /**
   * Get background color classes with fallback
   */
  const getBackgroundColorClasses = (bgColor?: string): string => {
    if (!bgColor) return DEFAULT_BACKGROUND;
    return BACKGROUND_COLORS[bgColor] || DEFAULT_BACKGROUND;
  };

  if (!section?._type) {
    return null;
  }

  // Hero Section
  if (section._type === "heroSection") {
    return (
      <ErrorBoundary>
        <HeroSection
          heading={section.heading}
          subheading={section.subheading}
          description={section.description}
          backgroundImages={section.backgroundImages as any}
          backgroundColor={section.backgroundColor as BackgroundColor}
          ctaButton={section.ctaButton as any}
        />
      </ErrorBoundary>
    );
  }

  // About Section
  if (section._type === "aboutSection") {
    return (
      <ErrorBoundary>
        <section
          className={cn(
            "py-16 lg:py-20",
            getBackgroundColorClasses(section.backgroundColor)
          )}
          aria-labelledby={section.heading ? "about-heading" : undefined}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {section.heading && (
              <header className="text-center mb-12 lg:mb-16">
                <h2
                  id="about-heading"
                  className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
                >
                  {section.heading}
                </h2>
              </header>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Content */}
              <div>
                {section.content && (
                  <div className="prose prose-lg max-w-none prose-headings:text-current prose-p:text-current prose-a:text-[#1E7A37] hover:prose-a:text-[#166f30]">
                    <PortableText value={section.content} />
                  </div>
                )}

                {/* Features */}
                {section.features && section.features.length > 0 && (
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {section.features.map((feature, index) => {
                      const iconUrl = feature.icon
                        ? getImageUrl(feature.icon, 48, 48)
                        : null;

                      return (
                        <article
                          key={`${feature.order}-${index}`}
                          className="flex items-start gap-4"
                        >
                          {iconUrl && (
                            <div className="flex-shrink-0">
                              <Image
                                src={iconUrl}
                                alt=""
                                width={48}
                                height={48}
                                className="w-12 h-12 object-contain"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">
                              {feature.title}
                              {feature.value && (
                                <span className="ml-2 text-[#1E7A37] font-bold">
                                  {feature.value}
                                </span>
                              )}
                            </h3>
                            {feature.description && (
                              <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                              </p>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Images */}
              {section.images && section.images.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {section.images.map((image, index) => {
                    const imageUrl = getImageUrl(image.asset, 400, 300);

                    if (!imageUrl) {
                      return (
                        <div
                          key={index}
                          className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center"
                        >
                          <p className="text-gray-500 text-sm">
                            Image not available
                          </p>
                        </div>
                      );
                    }

                    return (
                      <figure key={index} className="relative">
                        <Image
                          src={imageUrl}
                          alt={image.alt || `About image ${index + 1}`}
                          width={400}
                          height={300}
                          className="w-full h-48 object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                        {image.caption && (
                          <figcaption className="text-sm text-gray-500 mt-2 text-center">
                            {image.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </ErrorBoundary>
    );
  }

  // Content and Contact sections can be removed if not used
  // Add back only if needed in the future

  // Features Section
  if (section._type === "featuresSection") {
    return (
      <ErrorBoundary>
        <FeaturesSection
          heading={section.heading}
          subheading={section.subheading}
          description={section.description}
          features={section.features as any}
          media={section.media as any}
          backgroundColor={section.backgroundColor as BackgroundColor}
          layout={section.layout as any}
          ctaButton={section.ctaButton as any}
          liveChat={section.liveChat as any}
        />
      </ErrorBoundary>
    );
  }

  // Videos Section
  if (section._type === "videosSection") {
    return (
      <ErrorBoundary>
        <VideosSection
          heading={section.heading}
          subheading={section.subheading}
          description={section.description}
          videos={section.videos as any}
          backgroundColor={section.backgroundColor as BackgroundColor}
          accessControl={section.accessControl as any}
          layout={section.layout as any}
          enrollButton={section.enrollButton as any}
        />
      </ErrorBoundary>
    );
  }

  // Unknown section type - return null
  if (process.env.NODE_ENV === "development") {
    console.warn(`Unknown section type: ${section._type}`);
  }
  return null;
};

// Set display name for debugging
SectionRenderer.displayName = "SectionRenderer";

export default SectionRenderer;
