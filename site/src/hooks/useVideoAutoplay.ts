import { useEffect, useRef, useCallback } from "react";
import { VideoError } from "@/types/sanity";

interface UseVideoAutoplayOptions {
  /**
   * Threshold for intersection observer (0-1)
   * @default 0.3
   */
  readonly threshold?: number;

  /**
   * Root margin for intersection observer
   * @default "0px"
   */
  readonly rootMargin?: string;

  /**
   * Whether to enable autoplay functionality
   * @default true
   */
  readonly enabled?: boolean;

  /**
   * Callback fired when video starts playing
   */
  readonly onPlay?: () => void;

  /**
   * Callback fired when video pauses
   */
  readonly onPause?: () => void;

  /**
   * Callback fired when video encounters an error
   */
  readonly onError?: (error: VideoError) => void;
}

interface UseVideoAutoplayReturn {
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
  readonly sectionRef: React.RefObject<HTMLElement | null>;
  readonly isPlaying: boolean;
  readonly error: VideoError | null;
  readonly play: () => Promise<void>;
  readonly pause: () => void;
}

export const useVideoAutoplay = ({
  threshold = 0.3,
  rootMargin = "0px",
  enabled = true,
  onPlay,
  onPause,
  onError,
}: UseVideoAutoplayOptions = {}): UseVideoAutoplayReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isPlayingRef = useRef<boolean>(false);
  const errorRef = useRef<VideoError | null>(null);

  /**
   * Attempts to play the video with error handling
   */
  const play = useCallback(async (): Promise<void> => {
    if (!videoRef.current || !enabled) return;

    try {
      await videoRef.current.play();
      isPlayingRef.current = true;
      onPlay?.();
    } catch (error) {
      const videoError: VideoError = "src_not_supported";
      errorRef.current = videoError;
      onError?.(videoError);
      console.warn("Video autoplay failed:", error);
    }
  }, [enabled, onPlay, onError]);

  /**
   * Pauses the video
   */
  const pause = useCallback((): void => {
    if (!videoRef.current) return;

    videoRef.current.pause();
    isPlayingRef.current = false;
    onPause?.();
  }, [onPause]);

  /**
   * Handles video errors
   */
  const handleVideoError = useCallback((): void => {
    if (!videoRef.current) return;

    const error = videoRef.current.error;
    let videoError: VideoError = "network";

    if (error) {
      switch (error.code) {
        case MediaError.MEDIA_ERR_NETWORK:
          videoError = "network";
          break;
        case MediaError.MEDIA_ERR_DECODE:
          videoError = "decode";
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          videoError = "src_not_supported";
          break;
        default:
          videoError = "loading";
      }
    }

    errorRef.current = videoError;
    onError?.(videoError);
  }, [onError]);

  /**
   * Setup intersection observer for autoplay
   */
  useEffect(() => {
    if (!enabled || !sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isPlayingRef.current) {
            play();
          } else if (!entry.isIntersecting && isPlayingRef.current) {
            pause();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
    };
  }, [enabled, threshold, rootMargin, play, pause]);

  /**
   * Setup video event listeners
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener("error", handleVideoError);
    video.addEventListener("loadstart", () => {
      errorRef.current = null;
    });

    return () => {
      video.removeEventListener("error", handleVideoError);
      video.removeEventListener("loadstart", () => {
        errorRef.current = null;
      });
    };
  }, [handleVideoError]);

  return {
    videoRef,
    sectionRef,
    isPlaying: isPlayingRef.current,
    error: errorRef.current,
    play,
    pause,
  };
};
