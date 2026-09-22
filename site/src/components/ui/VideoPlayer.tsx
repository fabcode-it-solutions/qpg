import React, { forwardRef } from "react";
import { VideoError } from "@/types/sanity";
import { cn } from "@/lib/utils/utils";

interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  /**
   * Video source URL
   */
  readonly src: string;

  /**
   * Alternative video sources for better compatibility
   */
  readonly sources?: readonly {
    readonly src: string;
    readonly type: string;
  }[];

  /**
   * Video caption/description
   */
  readonly caption?: string;

  /**
   * Loading state
   */
  readonly isLoading?: boolean;

  /**
   * Error state
   */
  readonly error?: VideoError | null;

  /**
   * Custom error message
   */
  readonly errorMessage?: string;

  /**
   * Show loading indicator
   */
  readonly showLoadingIndicator?: boolean;

  /**
   * Additional CSS classes
   */
  readonly className?: string;

  /**
   * Container CSS classes
   */
  readonly containerClassName?: string;
}

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "absolute inset-0 flex items-center justify-center bg-black/20",
      className
    )}
    role="status"
    aria-label="Loading video"
  >
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
  </div>
);

/**
 * Error display component
 */
const ErrorDisplay: React.FC<{
  error: VideoError;
  message?: string;
  className?: string;
}> = ({ error, message, className }) => {
  const getErrorMessage = (errorType: VideoError): string => {
    switch (errorType) {
      case "network":
        return "Network error occurred while loading video";
      case "decode":
        return "Video format not supported";
      case "src_not_supported":
        return "Video source not available";
      case "loading":
        return "Failed to load video";
      default:
        return "An error occurred while playing video";
    }
  };

  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-black/80 text-white text-center p-4",
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div>
        <div className="text-red-400 mb-2">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-sm">{message || getErrorMessage(error)}</p>
      </div>
    </div>
  );
};

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      src,
      sources = [],
      caption,
      isLoading = false,
      error = null,
      errorMessage,
      showLoadingIndicator = true,
      className,
      containerClassName,
      ...props
    },
    ref
  ) => {
    const defaultSources = [
      { src, type: "video/mp4" },
      { src, type: "video/webm" },
      { src, type: "video/ogg" },
      ...sources,
    ];

    return (
      <figure
        className={cn(
          "relative w-full h-full flex flex-col",
          containerClassName
        )}
      >
        <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl bg-black">
          <video
            ref={ref}
            controls
            className={cn(
              "absolute inset-0 w-full h-full object-cover",
              error && "opacity-50",
              className
            )}
            aria-label={caption || "Video content"}
            {...props}
          >
            {defaultSources.map((source, index) => (
              <source key={index} src={source.src} type={source.type} />
            ))}
            <track kind="captions" label="English" default />
            Your browser does not support the video tag.
          </video>

          {/* Loading State */}
          {isLoading && showLoadingIndicator && <LoadingSpinner />}

          {/* Error State */}
          {error && <ErrorDisplay error={error} message={errorMessage} />}
        </div>

        {/* Caption */}
        {caption && !error && (
          <figcaption className="text-sm text-gray-400 mt-3 text-center">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";
