import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { videoUnlockService } from "@/lib/services/video-unlock.service";
import { notFound, redirect } from "next/navigation";
import BunnySecureVideoPlayer from "@/components/video/BunnySecureVideoPlayer";
import VideoUnlockRefresher from "@/components/video/VideoUnlockRefresher";
import { VideoPageProps } from "@/types/video";
import { Clock, Lock, CheckCircle2, Eye } from "lucide-react";
import { CourseContentIcon, BackArrowIcon } from "@/components/icons";

const courseService = hybridCourseService;

export default async function VideoPage({ params }: VideoPageProps) {
  const { courseId, videoId } = await params;
  const session = await getServerSession(authOptions);

  try {
    // Get course and video details
    const course = await courseService.getCourseById(courseId);
    if (!course) {
      notFound();
    }

    const video = await courseService.getVideoById(videoId);
    if (!video || video.courseId !== courseId) {
      notFound();
    }

    // All videos require authentication and subscription
    if (!session?.user?.id) {
      redirect(
        `/auth/login?callbackUrl=/courses/${courseId}/videos/${videoId}`
      );
    }

    // Check if user has course subscription
    const hasSubscription = await courseService.hasUserAccess(
      session.user.id,
      courseId
    );

    // Require subscription for all videos
    if (!hasSubscription) {
      redirect(`/courses/${courseId}`);
    }

    // Check if this specific video is unlocked using progressive unlock rules
    const videoAccess = await videoUnlockService.checkVideoAccess(
      session.user.id,
      videoId
    );

    if (!videoAccess) {
      console.log(`[VideoPage] No video access info, returning 404`);
      notFound();
    }

    // If video is not unlocked and user can't preview, redirect to course page
    if (!videoAccess.isUnlocked && !videoAccess.canPreview) {
      redirect(
        `/courses/${courseId}?error=video_locked&reason=${encodeURIComponent(
          videoAccess.unlockReason || "Video is not available yet"
        )}`
      );
    }

    // Get all videos in the course for navigation
    const courseWithVideos = await courseService.getCourseWithVideos(courseId);
    const allVideos = courseWithVideos?.videos || [];

    // Check access for each video individually
    const videosWithAccess = await Promise.all(
      allVideos.map(async (video) => {
        const access = await videoUnlockService.checkVideoAccess(
          session.user.id,
          video.id
        );
        return {
          ...video,
          isUnlocked: access?.isUnlocked || false,
          canPreview: access?.canPreview || false,
          unlockReason: access?.unlockReason,
          unlockDate: access?.unlockDate,
        };
      })
    );

    const availableVideos = videosWithAccess;

    // Get user progress for this video if they have access
    let userProgress = null;
    if (hasSubscription && session?.user?.id) {
      try {
        userProgress = await courseService.getUserVideoProgress(
          session.user.id,
          videoId
        );
      } catch (error) {
        console.log("No existing progress found");
      }
    }

    return (
      <div className="min-h-screen bg-black">
        {/* Component to handle video unlock refresh after completion */}
        <VideoUnlockRefresher courseId={courseId} />

        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col xl:flex-row gap-6 max-w-screen-2xl mx-auto">
            {/* Video Player - Takes full width on mobile, larger on desktop */}
            <div className="flex-1 xl:flex-[3]">
              <BunnySecureVideoPlayer
                video={video}
                course={course}
                hasAccess={videoAccess.isUnlocked}
                userProgress={userProgress}
              />
            </div>

            {/* Video List Sidebar */}
            <div className="w-full xl:flex-1 xl:max-w-sm">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 xl:sticky xl:top-6 max-h-[80vh] overflow-y-auto">
                <h2 className="text-white text-lg font-semibold mb-6 flex items-center gap-2">
                  <CourseContentIcon size={20} className="text-(--color-gold)" />
                  Course Content
                </h2>
                <div className="space-y-2">
                  {availableVideos.map((v, index) => {
                    const isCurrentVideo = v.id === videoId;
                    const canAccess = v.isUnlocked || v.canPreview;

                    return (
                      <div
                        key={v.id}
                        className={`relative rounded-xl text-sm transition-all duration-200 ${
                          isCurrentVideo
                            ? "bg-(--color-gold) text-black"
                            : canAccess
                            ? "bg-white/5 text-white/80 hover:bg-white/10 border border-white/10"
                            : "bg-white/5 text-white/40 border border-white/10 opacity-60"
                        }`}
                      >
                        {canAccess ? (
                          <a
                            href={`/courses/${courseId}/videos/${v.id}`}
                            className="block p-4 group"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                                  isCurrentVideo
                                    ? "bg-black/20 text-black"
                                    : v.isUnlocked
                                    ? "bg-(--color-gold)/20 text-(--color-gold)"
                                    : "bg-yellow-500/20 text-yellow-400"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`font-medium truncate group-hover:text-white transition-colors ${
                                    isCurrentVideo ? "text-black" : ""
                                  }`}
                                >
                                  {v.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {v.duration && (
                                    <div
                                      className={`text-xs flex items-center gap-1 ${
                                        isCurrentVideo
                                          ? "text-black/70"
                                          : "text-white/50"
                                      }`}
                                    >
                                      <Clock className="w-3 h-3" />
                                      {Math.floor(v.duration / 60)}:
                                      {(v.duration % 60)
                                        .toString()
                                        .padStart(2, "0")}
                                    </div>
                                  )}
                                  {!v.isUnlocked && v.canPreview && (
                                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30 flex items-center gap-1">
                                      <Eye className="w-2 h-2" />
                                      Preview
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center">
                                {v.isUnlocked ? (
                                  <CheckCircle2
                                    className={`w-4 h-4 ${
                                      isCurrentVideo
                                        ? "text-black/70"
                                        : "text-green-400"
                                    }`}
                                  />
                                ) : v.canPreview ? (
                                  <Eye className="w-4 h-4 text-yellow-400" />
                                ) : null}
                              </div>
                            </div>
                          </a>
                        ) : (
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium bg-white/10 text-white/50 flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {v.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {v.duration && (
                                    <div className="text-xs flex items-center gap-1 text-white/40">
                                      <Clock className="w-3 h-3" />
                                      {Math.floor(v.duration / 60)}:
                                      {(v.duration % 60)
                                        .toString()
                                        .padStart(2, "0")}
                                    </div>
                                  )}
                                </div>
                                {v.unlockReason && (
                                  <p className="text-xs text-white/50 mt-2">
                                    {v.unlockReason}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center">
                                <Lock className="w-4 h-4 text-white/40" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Course Info */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="text-center">
                    <h3 className="text-white font-medium mb-2">
                      {course.title}
                    </h3>
                    <p className="text-white/60 text-sm mb-2">
                      {availableVideos.length} lessons total
                    </p>
                    <p className="text-white/50 text-xs mb-4">
                      {availableVideos.filter((v) => v.isUnlocked).length}{" "}
                      unlocked •{" "}
                      {
                        availableVideos.filter(
                          (v) => !v.isUnlocked && v.canPreview
                        ).length
                      }{" "}
                      preview available
                    </p>
                    <a
                      href={`/courses/${courseId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
                    >
                      <BackArrowIcon size={16} />
                      Back to Course
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Video page error:", error);
    notFound();
  }
}
