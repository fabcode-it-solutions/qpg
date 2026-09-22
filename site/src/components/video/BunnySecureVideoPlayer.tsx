"use client";

import { useEffect, useRef, useState } from "react";
import { VideoPlayerProps, SecureVideoData } from "@/types/video";
import { useVideoProgressTracking } from "@/hooks/useVideoProgressTracking";
import Hls from "hls.js";
import {
  LockIcon,
  CheckCircleIcon,
  ErrorIcon,
  PlayCustomIcon,
  PauseCustomIcon,
  VolumeCustomIcon,
  SpinnerIcon,
} from "@/components/icons";
import { GlassCard } from "@/components/ui/GlassCard";
import { GoldButton } from "@/components/ui/GoldButton";

interface BunnySecureVideoPlayerProps extends VideoPlayerProps {}

export default function BunnySecureVideoPlayer({
  video,
  course,
  hasAccess,
  userProgress,
}: BunnySecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null!);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secureVideoData, setSecureVideoData] =
    useState<SecureVideoData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(
    userProgress?.watchedDuration || 0
  );
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);

  const tokenRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Video progress tracking with Zustand store
  const {
    handlePlay: onVideoPlay,
    handlePause: onVideoPause,
    handleSeek: onVideoSeek,
    handleEnded: onVideoEnded,
    getProgress,
    getProgressPercentage,
    isCompleted,
  } = useVideoProgressTracking({
    videoId: video.id,
    courseId: course.id,
    videoRef,
    hasAccess,
    initialProgress: userProgress
      ? {
          watchedDuration: userProgress.watchedDuration || 0,
          totalDuration: video.duration || 0,
          isCompleted: userProgress.isCompleted || false,
        }
      : undefined,
  });

  // Fetch secure streaming URL from Bunny.net
  useEffect(() => {
    if (!hasAccess) return;

    const fetchSecureStreamUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/videos/${video.id}/bunny-stream`);

        if (!response.ok) {
          throw new Error("Failed to get secure stream URL");
        }

        const data = await response.json();
        setSecureVideoData(data.video);

        // Set up token refresh before expiration
        const expiresAt = new Date(data.video.expiresAt);
        const refreshTime = expiresAt.getTime() - Date.now() - 5 * 60 * 1000; // Refresh 5 min before expiry

        if (refreshTime > 0) {
          tokenRefreshRef.current = setTimeout(() => {
            fetchSecureStreamUrl();
          }, refreshTime);
        }
      } catch (err) {
        console.error("Error fetching secure stream:", err);
        setError("Failed to load video. Please try again.");
        setIsLoading(false);
      }
    };

    fetchSecureStreamUrl();

    return () => {
      if (tokenRefreshRef.current) {
        clearTimeout(tokenRefreshRef.current);
      }
    };
  }, [hasAccess, video.id]);

  // Initialize HLS player with Bunny.net stream
  useEffect(() => {
    if (!secureVideoData || !videoRef.current) return;

    const initializePlayer = async () => {
      try {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: false,
            // Bunny.net specific configurations
            xhrSetup: (xhr) => {
              // Token is already in the URL from our API
              xhr.withCredentials = false;
            },
            manifestLoadPolicy: {
              default: {
                maxTimeToFirstByteMs: Infinity,
                maxLoadTimeMs: 20000,
                timeoutRetry: {
                  maxNumRetry: 2,
                  retryDelayMs: 1000,
                  maxRetryDelayMs: 8000,
                },
                errorRetry: {
                  maxNumRetry: 3,
                  retryDelayMs: 1000,
                  maxRetryDelayMs: 8000,
                },
              },
            },
          });

          hls.loadSource(secureVideoData.streamUrl);
          if (videoRef.current) {
            hls.attachMedia(videoRef.current);
          }

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsLoading(false);
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            console.error("HLS error:", data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  setError("Network error. Please check your connection.");
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  setError("Media error. Attempting recovery...");
                  hls.recoverMediaError();
                  break;
                default:
                  setError("Failed to load video.");
                  break;
              }
              setIsLoading(false);
            }
          });

          hlsRef.current = hls;
        } else if (
          videoRef.current &&
          videoRef.current.canPlayType("application/vnd.apple.mpegurl")
        ) {
          // Native HLS support (Safari)
          videoRef.current.src = secureVideoData.streamUrl;
          setIsLoading(false);
        } else {
          setError("HLS is not supported in your browser.");
        }
      } catch (err) {
        console.error("Failed to initialize video player:", err);
        setError("Failed to initialize video player.");
        setIsLoading(false);
      }
    };

    initializePlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [secureVideoData]); // Removed userProgress dependency to prevent re-renders

  // Track if this is the initial seek to prevent false progress updates
  const isInitialSeekRef = useRef(true);

  // Resume from last position after video loads
  useEffect(() => {
    if (videoRef.current && !isLoading && hasAccess) {
      const progress = getProgress();
      if (progress && progress.watchedDuration > 0) {
        // Only set initial position if video hasn't started playing yet
        if (videoRef.current.currentTime === 0) {
          isInitialSeekRef.current = true; // Mark as initial seek
          videoRef.current.currentTime = progress.watchedDuration;
          setCurrentTime(progress.watchedDuration);
        }
      }
    }
  }, [isLoading, hasAccess, getProgress]);

  // Video event handlers with progress tracking
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      // Reset initial seek flag once user actually plays
      isInitialSeekRef.current = false;
      // Progress tracking will be handled by video onPlay event
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      // Progress tracking will be handled by video onPause event
    }
  };

  // Security measures
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common recording shortcuts
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && (e.key === "s" || e.key === "S"))
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeeked = () => {
    // Don't trigger progress tracking on initial seek (resume from last position)
    if (isInitialSeekRef.current) {
      isInitialSeekRef.current = false; // Reset for future seeks
      return;
    }

    // Trigger progress tracking on user seek
    onVideoSeek();
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      // Trigger progress tracking on manual seek
      setTimeout(() => onVideoSeek(), 100);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!hasAccess) {
    return (
      <GlassCard className="text-center" padding="lg">
        <div className="max-w-md mx-auto">
          <div className="mb-6 flex justify-center">
            <div className="p-4 bg-white/5 rounded-full">
              <LockIcon className="w-16 h-16 text-(--color-gold)" />
            </div>
          </div>
          <h3 className="text-white text-xl font-semibold mb-3">
            Premium Content
          </h3>
          <p className="text-white/70 mb-6">
            Subscribe to access this secure video content.
          </p>
          <a href={`/courses/${course.id}`}>
            <GoldButton size="lg">Subscribe to Course</GoldButton>
          </a>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
      {/* Video Header */}
      <div className="bg-black/40 backdrop-blur-sm border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-semibold">{video.title}</h1>
            <p className="text-white/60 text-sm mt-1">{course.title}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <CheckCircleIcon className="w-4 h-4 text-(--color-gold)" />
            <span className="text-xs font-medium text-white/80">
              Secure Streaming
            </span>
          </div>
        </div>
      </div>

      {/* Video Player Container */}
      <div className="relative bg-black aspect-video">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-30">
            <div className="text-center">
              <div className="mb-4">
                <SpinnerIcon className="h-12 w-12 text-(--color-gold) mx-auto animate-spin" />
              </div>
              <p className="text-white/60 text-sm">
                Loading secure video stream...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm z-30">
            <div className="text-center">
              <div className="mb-4">
                <div className="p-4 bg-red-500/10 rounded-full inline-block">
                  <ErrorIcon className="w-12 h-12 text-red-400" />
                </div>
              </div>
              <p className="text-red-400 mb-6 text-sm">{error}</p>
              <GoldButton onClick={() => window.location.reload()} size="sm">
                Reload
              </GoldButton>
            </div>
          </div>
        )}

        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full"
          onPlay={() => {
            setIsPlaying(true);
            onVideoPlay();
          }}
          onPause={() => {
            setIsPlaying(false);
            onVideoPause();
          }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleSeeked}
          onEnded={onVideoEnded}
          controls
          onContextMenu={(e) => e.preventDefault()}
          controlsList="nodownload nofullscreen noremoteplaybook"
          disablePictureInPicture
          playsInline
        />

        {/* Custom Controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-all duration-300 ${
            showControls
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          }`}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <div className="px-6 pb-6 pt-8">
            {/* Enhanced Progress Bar with Milestones */}
            <div className="mb-4 relative">
              {/* Progress tracking indicator */}
              {isPlaying && (
                <div className="absolute -top-6 left-0 flex items-center gap-2">
                  <div className="w-2 h-2 bg-(--color-gold) rounded-full animate-pulse"></div>
                  <span className="text-xs text-white/50">
                    Tracking progress
                  </span>
                </div>
              )}

              {/* Milestone markers */}
              <div className="absolute top-0 w-full h-2 pointer-events-none">
                {[25, 50, 75].map((milestone) => (
                  <div
                    key={milestone}
                    className={`absolute top-0 w-0.5 h-2 transition-colors ${
                      getProgressPercentage() >= milestone
                        ? "bg-(--color-gold)"
                        : "bg-white/20"
                    }`}
                    style={{ left: `${milestone}%` }}
                    title={`${milestone}% milestone`}
                  />
                ))}
              </div>

              {/* Progress Bar Background */}
              <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full transition-all duration-300"
                  style={{
                    width: `${(currentTime / duration) * 100}%`,
                    background: isCompleted()
                      ? "linear-gradient(90deg, #10b981, #059669)"
                      : "linear-gradient(90deg, var(--color-gold), #f59e0b)",
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Progress percentage indicator */}
              <div className="absolute -bottom-5 right-0 flex items-center gap-2">
                <span className="text-xs text-white/50">
                  {getProgressPercentage()}% complete
                </span>
                {isCompleted() && (
                  <CheckCircleIcon className="w-3 h-3 text-green-400" />
                )}
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Play/Pause Button */}
                <button
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-200 group"
                  disabled={isLoading}
                >
                  {isPlaying ? (
                    <PauseCustomIcon className="w-6 h-6 text-white group-hover:text-(--color-gold) transition-colors" />
                  ) : (
                    <PlayCustomIcon className="w-6 h-6 text-white group-hover:text-(--color-gold) transition-colors" />
                  )}
                </button>

                {/* Time Display */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white font-medium">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-white/40">/</span>
                  <span className="text-white/60">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <VolumeCustomIcon className="w-5 h-5 text-white/80" />
                </button>
                <div className="relative w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-(--color-gold) transition-all"
                    style={{ width: `${volume * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      {video.description && (
        <div className="bg-black/40 backdrop-blur-sm border-t border-white/10 px-6 py-4">
          <p className="text-white/70 text-sm leading-relaxed">
            {video.description}
          </p>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-3">
        <div className="flex items-center justify-center gap-2">
          <div className="w-1 h-1 bg-white/30 rounded-full"></div>
          <p className="text-xs text-white/40 text-center">Secure streaming</p>
          <div className="w-1 h-1 bg-white/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
