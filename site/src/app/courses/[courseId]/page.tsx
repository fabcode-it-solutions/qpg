import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { enhancedProgressService } from "@/lib/services/enhanced-progress.service";
import { checkCourseAccess } from "@/lib/access-control/course-access";
import { formatTimeRemaining } from "@/lib/utils/time-formatter";
import CourseDetailWithMilestones from "@/components/courses/CourseDetailWithMilestones";
import CourseAccess from "@/components/courses/CourseAccess";
import HeroEnrollmentCard from "@/components/courses/HeroEnrollmentCard";
import {
  DashboardIcon,
  CourseChevronRightIcon,
  CoursesIcon,
  CourseClockIcon,
  CourseCheckCircleIcon,
  VideoLessonsIcon,
  SuccessCheckIcon,
} from "@/components/icons";
import { notFound } from "next/navigation";
import Link from "next/link";

const courseService = hybridCourseService;

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { courseId } = await params;
  const { success } = await searchParams;

  try {
    const course = await courseService.getCourseWithVideos(courseId);
    if (!course) {
      notFound();
    }

    let hasAccess = false;
    let progress = null;
    let accessInfo = null;

    if (session?.user?.id) {
      accessInfo = await checkCourseAccess(session.user.id, courseId);
      hasAccess = accessInfo.hasAccess;

      if (hasAccess) {
        // Use enhanced progress service for accurate progress data
        progress = await enhancedProgressService.getEnhancedCourseProgress(
          session.user.id,
          courseId
        );
      }
    }

    return (
      <div className="min-h-screen bg-black">
        {success && (
          <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-400 px-4 sm:px-6 py-3 sm:py-4 mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-xl sm:rounded-2xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <SuccessCheckIcon size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="font-semibold text-base sm:text-lg">
                  Welcome to your course!
                </p>
                <p className="text-green-300 text-sm sm:text-base">
                  Subscription successful! You now have full access to all
                  course content.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Breadcrumbs */}
        <div className="bg-black border-b border-white/10">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm min-w-0 flex-1">
                <Link
                  href="/dashboard"
                  className="text-white/60 hover:text-(--color-gold) transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <DashboardIcon size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Dashboard</span>
                </Link>
                <CourseChevronRightIcon
                  size={12}
                  className="text-white/40 sm:w-4 sm:h-4 flex-shrink-0"
                />
                <Link
                  href="/courses"
                  className="text-white/60 hover:text-(--color-gold) transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <CoursesIcon size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">All Courses</span>
                  <span className="sm:hidden">Courses</span>
                </Link>
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 text-white/40 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-(--color-gold) font-medium truncate">
                  {course.title}
                </span>
              </nav>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <Link
                  href="/courses"
                  className="text-white/60 hover:text-(--color-gold) transition-colors text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Browse More</span>
                  <span className="sm:hidden">Browse</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced course hero section */}
        <div className="bg-gradient-to-r from-black via-gray-900 to-black py-8 sm:py-12 lg:py-20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 items-start">
              {/* Left Column - Course Info */}
              <div className="lg:col-span-2">
                <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-(--color-gold) mb-4 sm:mb-6">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-(--color-gold) rounded-full animate-pulse"></span>
                  {course.category || "Course"}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                  {course.title}
                </h1>

                <p className="text-base sm:text-lg lg:text-xl text-white/70 mb-6 sm:mb-8 leading-relaxed">
                  {course.shortDescription || course.description}
                </p>

                {/* Course stats */}
                {/* <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                    <CourseClockIcon
                      size={14}
                      className="text-(--color-gold) sm:w-4 sm:h-4"
                    />
                    <span className="text-xs sm:text-sm font-medium text-white">
                      {course.duration
                        ? `${Math.floor(course.duration / 60)}h ${
                            course.duration % 60
                          }m`
                        : "Self-paced"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                    <CourseCheckCircleIcon
                      size={14}
                      className="text-(--color-gold) sm:w-4 sm:h-4"
                    />
                    <span className="text-xs sm:text-sm font-medium text-white capitalize">
                      {course.difficulty || "All Levels"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                    <VideoLessonsIcon
                      size={14}
                      className="text-(--color-gold) sm:w-4 sm:h-4"
                    />
                    <span className="text-xs sm:text-sm font-medium text-white">
                      {course.videos?.length || 0} lessons
                    </span>
                  </div>
                  {hasAccess && progress && (
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                      <CourseCheckCircleIcon
                        size={14}
                        className="text-(--color-gold) sm:w-4 sm:h-4"
                      />
                      <span className="text-xs sm:text-sm font-medium text-white">
                        {progress.progressPercentage || 0}% Complete
                      </span>
                    </div>
                  )}
                </div> */}

                {/* Progress Bar for Enrolled Users */}
                {hasAccess && progress && (
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-white">
                        Your Progress
                      </h3>
                      <span className="text-(--color-gold) font-bold text-sm sm:text-base">
                        {progress.progressPercentage || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2 sm:h-3 overflow-hidden mb-3">
                      <div
                        className="bg-(--color-gold) rounded-full h-2 sm:h-3 transition-all duration-500"
                        style={{
                          width: `${progress.progressPercentage || 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm text-white/70">
                      <span>
                        {progress.completedVideos || 0} of{" "}
                        {progress.totalVideos || course.videos?.length || 0}{" "}
                        lessons completed
                      </span>
                      {progress.estimatedTimeRemaining > 0 && (
                        <span>
                          ~
                          {formatTimeRemaining(progress.estimatedTimeRemaining)}{" "}
                          remaining
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Course Thumbnail & Access */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:sticky lg:top-6">
                  {/* Course Thumbnail */}
                  {course.thumbnailUrl && (
                    <div className="relative mb-4 sm:mb-6">
                      <div className="absolute inset-0 bg-(--color-gold)/20 rounded-lg sm:rounded-xl blur-xl transform scale-105"></div>
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="relative w-full rounded-lg sm:rounded-xl border border-white/10"
                      />
                    </div>
                  )}

                  {/* Dynamic Enrollment Card */}
                  <HeroEnrollmentCard
                    course={course}
                    hasAccess={hasAccess}
                    progress={progress}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full course content requires access */}
        <CourseAccess courseId={courseId} course={course}>
          <CourseDetailWithMilestones
            course={course}
            hasAccess={hasAccess}
            progress={progress || undefined}
          />
        </CourseAccess>
      </div>
    );
  } catch (error) {
    console.error("Error loading course:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    notFound();
  }
}
