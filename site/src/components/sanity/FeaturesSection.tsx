"use client";

import React from "react";
import { useVideoAutoplay } from "@/hooks/useVideoAutoplay";
import { VideoPlayer } from "../ui/VideoPlayer";
import { FeatureList } from "../ui/FeatureItem";
import { LiveChatWidget } from "../ui/LiveChatWidget";
import CustomButton from "../common/CustomButton";
import type {
  FeaturesSectionProps,
  BackgroundColor,
  VideoError,
} from "@/types/sanity";
import { cn } from "@/lib/utils/utils";

/**
 * Background color mapping for consistent theming
 */
const backgroundColorMap: Record<BackgroundColor, string> = {
  white: "bg-white text-gray-900",
  "gray-50": "bg-gray-50 text-gray-900",
  "gray-900": "bg-gray-900 text-white",
  black: "bg-black text-white",
  primary: "bg-[#1E7A37] text-white",
} as const;

/**
 * Default background color fallback
 */
const DEFAULT_BACKGROUND = "bg-black text-white";

const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  heading,
  subheading,
  description,
  features = [],
  media,
  backgroundColor = "black",
  layout = "side-by-side",
  ctaButton,
  liveChat,
}) => {
  // Video autoplay hook with error handling
  const {
    videoRef,
    sectionRef,
    error: videoError,
  } = useVideoAutoplay({
    threshold: 0.3,
    enabled: media?.mediaType === "video",
    onError: (error: VideoError) => {
      console.warn(`Video playback error: ${error}`);
    },
  });

  /**
   * Get background color classes for the section
   */
  const getBackgroundColorClasses = (bgColor: BackgroundColor): string => {
    return backgroundColorMap[bgColor] || DEFAULT_BACKGROUND;
  };

  /**
   * Get button styling classes based on style prop
   */
  const getButtonClasses = (style: string): string => {
    switch (style) {
      case "outlined":
        return "text-lg 2xl:text-[40px] uppercase px-8 py-3 2xl:px-18 2xl:py-5 border border-(--color-gold) text-(--color-gold) !rounded-[50px] hover:bg-(--color-gold) hover:text-black transition-all duration-300 font-medium";
      case "filled":
        return "text-lg 2xl:text-[40px] uppercase px-8 py-3 2xl:px-18 2xl:py-5 bg-(--color-gold) text-black !rounded-[50px] hover:bg-transparent hover:border hover:border-(--color-gold) hover:text-(--color-gold) transition-all duration-300 font-medium";
      case "primary":
        return "text-lg 2xl:text-[40px] uppercase px-8 py-3 2xl:px-18 2xl:py-5 bg-[#1E7A37] text-white !rounded-[50px] hover:bg-[#166f30] transition-all duration-300 font-medium";
      default:
        return "text-lg 2xl:text-[40px] uppercase px-8 py-3 2xl:px-18 2xl:py-5 border border-(--color-gold) text-(--color-gold) !rounded-[50px] hover:bg-(--color-gold) hover:text-black transition-all duration-300 font-medium";
    }
  };

  /**
   * Renders the pricing information above the CTA button
   */
  const renderPricing = (): React.ReactNode => {
    const pricing = ctaButton?.pricing;
    if (!pricing?.showPricing) {
      return null;
    }

    return (
      <div className="text-center mb-8">
        {pricing.title && (
          <h3 className="text-xl md:text-2xl font-bold text-white mb-4">
            {pricing.title}
          </h3>
        )}
        <div className="space-y-2">
          {pricing.standardPrice && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-gray-300 text-lg">
                {pricing.standardPrice.label}
              </span>
              <span className="text-white text-xl font-semibold line-through opacity-75">
                {pricing.standardPrice.amount}
              </span>
            </div>
          )}
          {pricing.offerPrice && (
            <div className="flex flex-col items-center">
              <span className="text-[var(--color-gold)] text-lg font-medium">
                {pricing.offerPrice.label}
              </span>
              <span className="text-[var(--color-gold)] text-3xl md:text-4xl font-bold">
                {pricing.offerPrice.amount}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Renders the CTA button and live chat widget in the same row
   */
  const renderCtaAndChat = (): React.ReactNode => {
    const showButton =
      ctaButton?.showButton && ctaButton?.text && ctaButton?.href;
    const showChat = liveChat?.showChat;
    const showPricing = ctaButton?.pricing?.showPricing;

    if (!showButton && !showChat && !showPricing) {
      return null;
    }

    return (
      <div className="mt-8 lg:mt-24">
        {/* Pricing Information */}
        {renderPricing()}

        {/* CTA Button and Live Chat */}
        {(showButton || showChat) && (
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* CTA Button */}
            {showButton && (
              <div className="flex-shrink-0">
                <CustomButton
                  as="a"
                  href={ctaButton.href}
                  className={getButtonClasses(ctaButton.style || "outlined")}
                >
                  {ctaButton.text}
                </CustomButton>
              </div>
            )}

            {/* Live Chat Widget */}
            {showChat && (
              <div className="flex-shrink-0">
                <LiveChatWidget
                  title={liveChat.title}
                  className="rounded-[50px]"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /**
   * Renders the video component with error handling
   */
  const renderVideoPlayer = (): React.ReactNode => {
    if (!media || media.mediaType !== "video") {
      return null;
    }
    // Handle both videoUrl and video object from Sanity
    const videoSource = media.videoUrl || (media as any).video?.asset?.url;

    if (!videoSource) {
      return (
        <div className="aspect-video rounded-lg bg-gray-800 flex items-center justify-center">
          <p className="text-gray-400 text-center">
            Video source not available
          </p>
        </div>
      );
    }

    return (
      <VideoPlayer
        ref={videoRef}
        src={videoSource}
        caption={media.caption}
        loop
        playsInline
        preload="metadata"
        error={videoError}
        className="w-full h-full object-cover"
        containerClassName="w-full h-full"
      />
    );
  };

  /**
   * Renders the section header if content is provided
   */
  const renderHeader = (): React.ReactNode => {
    if (!heading && !subheading && !description) {
      return null;
    }

    return (
      <header className="text-left mb-12 lg:mb-16">
        {heading && (
          <h2 className="text-2xl md:text-4xl 2xl:text-[50px] font-bold mb-4 lg:mb-6 text-(--color-gold)">
            {heading}
          </h2>
        )}
        {subheading && (
          <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-4 lg:mb-6">
            {subheading}
          </p>
        )}
        {description && (
          <p className="text-base lg:text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </header>
    );
  };

  return (
    <section
      ref={sectionRef}
      className={cn(
        "py-16 lg:py-20",
        getBackgroundColorClasses(backgroundColor)
      )}
      aria-labelledby={heading ? "features-heading" : undefined}
    >
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Side-by-side layout */}
        {layout === "side-by-side" && (
          <div className="grid grid-cols-1 xl:grid-cols-[60%_40%] gap-8 items-center">
            {/* Video Section - 60% */}
            <div className="order-1 lg:order-1 flex justify-center items-center">
              <div
                className={cn(
                  "relative w-full overflow-hidden rounded-lg",
                  "aspect-[1.25]",
                  "max-h-[400px]",
                  "sm:max-h-[450px]",
                  "md:max-h-[500px]",
                  "lg:max-h-[600px]",
                  "xl:max-h-[700px]",
                  "2xl:max-h-[800px]",
                  "min-[1920px]:w-[1000px] min-[1920px]:h-[800px]",
                  "min-[1920px]:max-w-[1000px] min-[1920px]:max-h-[800px]"
                )}
              >
                {renderVideoPlayer()}
              </div>
            </div>

            {/* Features Section - 40% */}
            <div className="order-2 lg:order-2">
              {renderHeader()}
              <FeatureList
                features={features}
                variant="default"
                iconSize="lg"
                bulletColor="gold"
                spacing="normal"
                titleClassName="text-white"
                descriptionClassName="text-gray-300"
              />
            </div>
          </div>
        )}

        {/* Alternative layouts */}
        {layout !== "side-by-side" && (
          <div className="text-center">
            {renderVideoPlayer()}

            <div className="mt-12">
              {layout === "grid-2" && (
                <div className="grid md:grid-cols-2 gap-8">
                  <FeatureList
                    features={features}
                    variant="compact"
                    iconSize="sm"
                    bulletColor="gold"
                    spacing="tight"
                    titleClassName="text-white text-left"
                    descriptionClassName="text-gray-300 text-left"
                    itemClassName="text-left"
                  />
                </div>
              )}

              {layout === "grid-3" && (
                <div className="grid md:grid-cols-3 gap-6">
                  <FeatureList
                    features={features}
                    variant="minimal"
                    iconSize="sm"
                    bulletColor="gold"
                    spacing="tight"
                    titleClassName="text-white text-left"
                    descriptionClassName="text-gray-300 text-left"
                    itemClassName="text-left"
                  />
                </div>
              )}

              {layout === "list" && (
                <FeatureList
                  features={features}
                  variant="default"
                  iconSize="md"
                  bulletColor="gold"
                  spacing="normal"
                  titleClassName="text-white text-left"
                  descriptionClassName="text-gray-300 text-left"
                  className="max-w-4xl mx-auto"
                  itemClassName="text-left"
                />
              )}
            </div>
          </div>
        )}
      </div>
      {renderCtaAndChat()}
    </section>
  );
};

// Set display name for debugging
FeaturesSection.displayName = "FeaturesSection";

export default FeaturesSection;
