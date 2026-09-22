"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { VideoPlayer } from "../ui/VideoPlayer";
import { GoldButton } from "../ui/GoldButton";
import type { VideosSectionProps, BackgroundColor } from "@/types/sanity";
import { cn } from "@/lib/utils/utils";

const backgroundColorMap: Record<BackgroundColor, string> = {
  white: "bg-white text-gray-900",
  "gray-50": "bg-gray-50 text-gray-900",
  "gray-900": "bg-gray-900 text-white",
  black: "bg-black text-white",
  primary: "bg-[#1E7A37] text-white",
};

const DEFAULT_BACKGROUND = "bg-black text-white";

const VideosSection: React.FC<VideosSectionProps> = ({
  heading,
  subheading,
  description,
  videos = [],
  backgroundColor = "black",
  accessControl,
  layout = "grid-2x2",
  enrollButton,
}) => {
  const { data: session, status } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const getBackgroundColorClasses = (bgColor: BackgroundColor): string => {
    return backgroundColorMap[bgColor] || DEFAULT_BACKGROUND;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getBunnyVideoUrl = (videoId: string, libraryId: string): string => {
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
  };

  const activeVideos = videos
    .filter((video) => video.isActive)
    .sort((a, b) => a.order - b.order);

  const handleVideoClick = (videoTitle: string) => {
    if (!session && accessControl?.requireLogin) {
      setSelectedVideo(videoTitle);
      setShowLoginModal(true);
      return;
    }
    // If logged in, video will play normally via iframe
  };

  const renderLoginModal = () => {
    if (!showLoginModal) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 rounded-lg p-8 border border-gray-700 relative">
          <button
            onClick={() => setShowLoginModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-4 text-[var(--color-gold)]">
              Login Required
            </h3>
            <p className="text-gray-300 mb-2">You need to log in to watch</p>
            <p className="text-[var(--color-gold)] font-medium mb-6">
              "{selectedVideo}"
            </p>
            <Link href="/auth/login" passHref>
              <GoldButton className="px-6 py-3 w-full">
                Sign In to Watch
              </GoldButton>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const renderVideoGrid = () => {
    if (layout === "grid-2x2") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {activeVideos.map((video, index) => (
            <div key={index} className="group">
              <div
                className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 mb-4 min-h-[200px] sm:min-h-[240px] cursor-pointer group"
                onClick={() => handleVideoClick(video.title)}
              >
                {session || !accessControl?.requireLogin ? (
                  <iframe
                    src={`${getBunnyVideoUrl(
                      video.bunnyVideoId,
                      video.bunnyLibraryId
                    )}?autoplay=false`}
                    className="w-full h-full"
                    allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <>
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-gold)]/20 rounded-full flex items-center justify-center group-hover:bg-[var(--color-gold)]/30 transition-colors">
                          <svg
                            className="w-8 h-8 text-[var(--color-gold)]"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        <p className="text-white/80 text-sm font-medium">
                          Click to Play
                        </p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  </>
                )}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-sm px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}
                {!session && accessControl?.requireLogin && (
                  <div className="absolute top-2 left-2 bg-[var(--color-gold)]/90 text-black text-xs px-2 py-1 rounded font-medium">
                    Premium
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-[var(--color-gold)] transition-colors">
                {video.title}
              </h3>
              {video.description && (
                <p className="text-gray-400 text-sm leading-relaxed">
                  {video.description}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (layout === "row-4") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {activeVideos.map((video, idx) => (
            <div key={idx} className="group">
              <div
                className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 mb-3 min-h-[160px] sm:min-h-[180px] cursor-pointer group"
                onClick={() => handleVideoClick(video.title)}
              >
                {session || !accessControl?.requireLogin ? (
                  <iframe
                    src={`${getBunnyVideoUrl(
                      video.bunnyVideoId,
                      video.bunnyLibraryId
                    )}?autoplay=false`}
                    className="w-full h-full"
                    allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <>
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 bg-[var(--color-gold)]/20 rounded-full flex items-center justify-center group-hover:bg-[var(--color-gold)]/30 transition-colors">
                          <svg
                            className="w-6 h-6 text-[var(--color-gold)]"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        <p className="text-white/80 text-xs font-medium">
                          Play
                        </p>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  </>
                )}
                {video.duration && (
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}
                {!session && accessControl?.requireLogin && (
                  <div className="absolute top-1 left-1 bg-[var(--color-gold)]/90 text-black text-xs px-1.5 py-0.5 rounded font-medium">
                    Premium
                  </div>
                )}
              </div>
              <h3 className="text-base font-medium mb-1 text-white group-hover:text-[var(--color-gold)] transition-colors">
                {video.title}
              </h3>
              {video.description && (
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                  {video.description}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (layout === "featured-grid" && activeVideos.length > 0) {
      const [featured, ...others] = activeVideos;
      return (
        <div className="space-y-8">
          {/* Featured Video */}
          <div className="group">
            <div
              className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 mb-4 max-w-4xl mx-auto min-h-[280px] sm:min-h-[320px] cursor-pointer group"
              onClick={() => handleVideoClick(featured.title)}
            >
              {session || !accessControl?.requireLogin ? (
                <iframe
                  src={`${getBunnyVideoUrl(
                    featured.bunnyVideoId,
                    featured.bunnyLibraryId
                  )}?autoplay=false`}
                  className="w-full h-full"
                  allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
                  allowFullScreen
                  loading="lazy"
                />
              ) : (
                <>
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-[var(--color-gold)]/20 rounded-full flex items-center justify-center group-hover:bg-[var(--color-gold)]/30 transition-colors">
                        <svg
                          className="w-10 h-10 text-[var(--color-gold)]"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <p className="text-white/80 font-medium">Click to Play</p>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                </>
              )}
              {featured.duration && (
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded">
                  {formatDuration(featured.duration)}
                </div>
              )}
              {!session && accessControl?.requireLogin && (
                <div className="absolute top-3 left-3 bg-[var(--color-gold)]/90 text-black text-sm px-3 py-1 rounded font-medium">
                  Premium Content
                </div>
              )}
            </div>
            <div className="text-center max-w-4xl mx-auto">
              <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-[var(--color-gold)] transition-colors">
                {featured.title}
              </h3>
              {featured.description && (
                <p className="text-gray-400 leading-relaxed">
                  {featured.description}
                </p>
              )}
            </div>
          </div>

          {/* Other Videos Grid */}
          {others.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {others.map((video, idx) => (
                <div key={idx} className="group">
                  <div
                    className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 mb-3 min-h-[160px] sm:min-h-[180px] cursor-pointer group"
                    onClick={() => handleVideoClick(video.title)}
                  >
                    {session || !accessControl?.requireLogin ? (
                      <iframe
                        src={`${getBunnyVideoUrl(
                          video.bunnyVideoId,
                          video.bunnyLibraryId
                        )}?autoplay=false`}
                        className="w-full h-full"
                        allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
                        allowFullScreen
                        loading="lazy"
                      />
                    ) : (
                      <>
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-2 bg-[var(--color-gold)]/20 rounded-full flex items-center justify-center group-hover:bg-[var(--color-gold)]/30 transition-colors">
                              <svg
                                className="w-6 h-6 text-[var(--color-gold)]"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                            <p className="text-white/80 text-xs font-medium">
                              Play
                            </p>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      </>
                    )}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        {formatDuration(video.duration)}
                      </div>
                    )}
                    {!session && accessControl?.requireLogin && (
                      <div className="absolute top-2 left-2 bg-[var(--color-gold)]/90 text-black text-xs px-1.5 py-0.5 rounded font-medium">
                        Premium
                      </div>
                    )}
                  </div>
                  <h3 className="text-base font-medium mb-1 text-white group-hover:text-[var(--color-gold)] transition-colors">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderHeader = () => {
    if (!heading && !subheading && !description && !enrollButton?.showButton)
      return null;

    return (
      <header className="text-center mb-12 lg:mb-16">
        {heading && (
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-[var(--color-gold)]">
            {heading}
          </h2>
        )}
        {subheading && (
          <p className="text-xl md:text-2xl text-gray-300 mb-6">{subheading}</p>
        )}
        {enrollButton?.showButton && (
          <div className="mb-6">
            <Link href={enrollButton.href} passHref>
              <GoldButton className="px-8 py-4 text-lg font-semibold">
                {enrollButton.text}
              </GoldButton>
            </Link>
          </div>
        )}
        {description && (
          <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </header>
    );
  };

  // Check authentication requirements
  if (status === "loading") {
    return (
      <section
        className={cn(
          "py-16 lg:py-20",
          getBackgroundColorClasses(backgroundColor)
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-gold)] mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  // Remove the early return for non-authenticated users
  // Now we show video previews to everyone

  if (activeVideos.length === 0) {
    return (
      <section
        className={cn(
          "py-16 lg:py-20",
          getBackgroundColorClasses(backgroundColor)
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderHeader()}
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-xl font-semibold mb-4 text-gray-400">
              No Videos Available
            </h3>
            <p className="text-gray-500">
              Videos will appear here once they are added and published.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "py-16 lg:py-20",
        getBackgroundColorClasses(backgroundColor)
      )}
      aria-labelledby={heading ? "videos-heading" : undefined}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderHeader()}
        {renderVideoGrid()}
        {renderLoginModal()}
      </div>
    </section>
  );
};

VideosSection.displayName = "VideosSection";

export default VideosSection;
