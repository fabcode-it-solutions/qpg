"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { getImageUrl } from "@/lib/sanity/client";
import { useResponsive } from "@/hooks/useResponsive";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import type { HeroImageGridProps } from "@/types/sanity";
import styles from "./HeroImageGrid.module.css";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { cn } from "@/lib/utils/utils";

/**
 * Layout configuration mapping
 */
const LAYOUT_CONFIGS = {
  row: {
    containerClasses: "flex w-full max-w-[1920px] mx-auto",
    imageClasses: "relative overflow-hidden flex-1",
    maxImages: 3,
    description: "Horizontal row layout with 3 images max",
  },
  "grid-2x2": {
    containerClasses: "grid grid-cols-2 gap-4",
    imageClasses:
      "relative aspect-square rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300",
    maxImages: 4,
    description: "2x2 grid layout",
  },
  masonry: {
    containerClasses: "columns-1 md:columns-3 gap-6 space-y-6",
    imageClasses:
      "relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 break-inside-avoid",
    maxImages: undefined,
    description: "Masonry layout with variable heights",
  },
} as const;

/**
 * Default responsive breakpoint for mobile/desktop switch
 */
const MOBILE_BREAKPOINT = 992;

const HeroImageGrid: React.FC<HeroImageGridProps> = ({
  images,
  layout = "row",
  className,
}) => {
  const [mounted, setMounted] = useState(false);

  // Use professional responsive hook
  const { isSmallScreen } = useResponsive({
    breakpoints: { desktop: MOBILE_BREAKPOINT },
    debounceMs: 100,
  });

  // Ensure component is mounted on client side to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoized sorted and filtered images for performance
  const processedImages = useMemo(() => {
    if (!images?.length) return [];

    const sorted = [...images].sort((a, b) => a.order - b.order);
    const config = LAYOUT_CONFIGS[layout];

    return config.maxImages ? sorted.slice(0, config.maxImages) : sorted;
  }, [images, layout]);

  /**
   * Get responsive styles for row layout images
   */
  const getResponsiveImageStyles = (index: number) => {
    if (layout !== "row") return {};

    const isCenter = index === 1;

    return {
      width: isCenter ? "min(600px, 31.25vw)" : "min(660px, 34.375vw)",
      height: "min(600px, 31.25vw)",
      minWidth: isCenter ? "200px" : "220px",
      minHeight: "200px",
    };
  };

  /**
   * Get optimized image dimensions based on layout and position
   */
  const getImageDimensions = (index: number) => {
    if (layout === "row") {
      const isCenter = index === 1;
      return {
        width: isCenter ? 600 : 660,
        height: 600,
      };
    }

    if (layout === "grid-2x2") {
      return { width: 400, height: 400 };
    }

    // Masonry layout
    return { width: 400, height: 600 };
  };

  /**
   * Renders empty state when no images are available
   */
  const renderEmptyState = (): React.ReactNode => (
    <div
      className={cn("text-center py-8", className)}
      role="img"
      aria-label="No images available"
    >
      <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
        <div className="text-gray-400 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-gray-500 font-medium mb-2">No images available</p>
        <p className="text-sm text-gray-400">
          Add images in Sanity CMS to display them here
        </p>
      </div>
    </div>
  );

  // Early return for empty state
  if (!processedImages.length) {
    return renderEmptyState();
  }

  /**
   * Renders mobile slider with Swiper
   */
  const renderMobileSlider = (): React.ReactNode => (
    <section
      className={cn("w-full", className)}
      aria-label={`Hero image slider with ${processedImages.length} images`}
    >
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        // autoplay={{
        //   delay: 4000,
        //   disableOnInteraction: false,
        //   pauseOnMouseEnter: true,
        // }}
        pagination={{
          clickable: true,
          bulletClass: "swiper-pagination-bullet",
          bulletActiveClass: "swiper-pagination-bullet-active",
        }}
        navigation={{
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        }}
        loop={processedImages.length > 1}
        className={cn(styles.heroSwiper, "hero-swiper")}
        a11y={{
          prevSlideMessage: "Previous image",
          nextSlideMessage: "Next image",
          paginationBulletMessage: "Go to slide {{index}}",
        }}
      >
        {processedImages.map((image, index) => {
          const imageUrl = getImageUrl(image.image, 800, 800);

          if (!imageUrl) {
            return (
              <SwiperSlide key={`${image.order}-${index}`}>
                <div className="relative w-full h-[350px] sm:h-[400px] bg-black flex items-center justify-center">
                  <p className="text-gray-500">Image not available</p>
                </div>
              </SwiperSlide>
            );
          }

          return (
            <SwiperSlide key={`${image.order}-${index}`}>
              <div className="relative w-full h-[400px] sm:h-[800px] overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={image.alt || `Hero image ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  style={{ opacity: image.opacity / 100 }}
                  priority={index === 0}
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 800px"
                />
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );

  /**
   * Renders desktop layout (row, grid, or masonry)
   */
  const renderDesktopLayout = (): React.ReactNode => {
    const config = LAYOUT_CONFIGS[layout];

    return (
      <section
        className={cn(config.containerClasses, className)}
        aria-label={`Hero images in ${layout} layout`}
      >
        {processedImages.map((image, index) => {
          const dimensions = getImageDimensions(index);
          const imageUrl = getImageUrl(
            image.image,
            dimensions.width,
            dimensions.height
          );

          if (!imageUrl) {
            return (
              <div
                key={`${image.order}-${index}`}
                className={cn(
                  config.imageClasses,
                  "bg-gray-200 flex items-center justify-center"
                )}
                style={getResponsiveImageStyles(index)}
                aria-label="Image not available"
              >
                <p className="text-gray-500 text-sm">Image not available</p>
              </div>
            );
          }

          const isCenter = layout === "row" && index === 1;

          return (
            <figure
              key={`${image.order}-${index}`}
              className={config.imageClasses}
              style={getResponsiveImageStyles(index)}
            >
              <Image
                src={imageUrl}
                alt={image.alt || `Hero image ${index + 1}`}
                fill={layout !== "masonry"}
                width={layout === "masonry" ? dimensions.width : undefined}
                height={layout === "masonry" ? dimensions.height : undefined}
                className={cn(
                  layout === "masonry" ? "w-full h-auto" : "object-cover",
                  layout !== "row" &&
                    "transition-transform duration-300 hover:scale-105"
                )}
                style={{ opacity: image.opacity / 100 }}
                priority={index < 2} // Prioritize first 2 images
                sizes={
                  layout === "row"
                    ? "(max-width: 1920px) 34.375vw, 660px"
                    : "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                }
              />

              {/* Hover overlay for non-row layouts */}
              {layout !== "row" && (
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"
                  aria-hidden="true"
                />
              )}
            </figure>
          );
        })}
      </section>
    );
  };

  // Prevent hydration mismatch by always rendering desktop layout on server
  // and switching to mobile slider only after client-side hydration
  const shouldUseMobileSlider = mounted && layout === "row" && isSmallScreen;

  return (
    <ErrorBoundary>
      {shouldUseMobileSlider ? renderMobileSlider() : renderDesktopLayout()}
    </ErrorBoundary>
  );
};

// Set display name for debugging
HeroImageGrid.displayName = "HeroImageGrid";

export default HeroImageGrid;
