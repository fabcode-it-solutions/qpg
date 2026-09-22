"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CourseDetailWithMilestonesProps } from "@/types/course";
import { CourseMilestones } from "./CourseMilestones";
import { CheckCircle2, Lock, AlertCircle, Trophy } from "lucide-react";

export default function CourseDetailWithMilestones({
  course,
  hasAccess,
}: CourseDetailWithMilestonesProps) {
  const { data: session } = useSession();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }

    setPurchasing(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to start purchase process. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // Check if progressive unlock is enabled
  const progressiveUnlockEnabled = course.progressiveUnlock?.enabled ?? false;
  console.log({ course });

  return (
    <div className="min-h-screen bg-black">
      <div
        id="course-content"
        className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Description */}
            {course.description && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-white">
                  About this course
                </h2>
                <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
                  <p className="text-white/80 leading-relaxed text-sm sm:text-base lg:text-lg">
                    {course.description}
                  </p>
                </div>
              </div>
            )}

            {/* Course Content / Milestones */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-white">
                Course Content
              </h2>

              {hasAccess ? (
                <CourseMilestones
                  courseId={course.id}
                  courseSlug={course.slug || course.id}
                />
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-(--color-gold)/10 border border-(--color-gold)/30 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                    <h3 className="font-semibold text-(--color-gold) mb-2 sm:mb-3 text-sm sm:text-base">
                      Progressive Learning Path
                    </h3>
                    <p className="text-white/70 leading-relaxed text-sm sm:text-base">
                      This course may use progressive content unlocking. Videos
                      unlock based on time elapsed or completion of previous
                      content.
                    </p>
                  </div>

                  <div className="text-center py-8 sm:py-12">
                    <div className="mb-4 sm:mb-6">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                        <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white/50" />
                      </div>
                    </div>
                    <p className="text-white/70 mb-4 sm:mb-6 text-base sm:text-lg">
                      Enroll to access the complete course content
                    </p>
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="bg-(--color-gold) text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold hover:bg-(--color-gold)/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                    >
                      {purchasing
                        ? "Processing..."
                        : `Enroll for ${formatPrice(course.price)}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:sticky lg:top-4">
              <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-white">
                Course Details
              </h3>

              <div className="space-y-4 sm:space-y-6">
                {/* Learning Outcomes */}
                {course.learningOutcomes &&
                  course.learningOutcomes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-2 sm:mb-3 text-sm sm:text-base">
                        What you'll learn
                      </h4>
                      <ul className="space-y-2 sm:space-y-3">
                        {course.learningOutcomes.map((outcome, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-white/80"
                          >
                            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0 mt-0.5" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Prerequisites */}
                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-2 sm:mb-3 text-sm sm:text-base">
                      Prerequisites
                    </h4>
                    <ul className="space-y-2 sm:space-y-3">
                      {course.prerequisites.map((prerequisite, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-white/80"
                        >
                          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <span>{prerequisite}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Progressive Unlock Info */}
                {progressiveUnlockEnabled && (
                  <div className="bg-(--color-gold)/10 border border-(--color-gold)/30 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <h4 className="font-semibold text-(--color-gold) mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                      Progressive Learning
                    </h4>
                    <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                      This course uses progressive content unlocking to guide
                      your learning journey. Videos unlock based on time and
                      completion rules.
                    </p>
                    {course.progressiveUnlock?.allowPreview && (
                      <p className="text-xs sm:text-sm text-(--color-gold)/80 mt-1.5 sm:mt-2">
                        Preview available for locked content
                      </p>
                    )}
                    {course.progressiveUnlock?.showLockedVideos === false && (
                      <p className="text-xs sm:text-sm text-(--color-gold)/80 mt-1.5 sm:mt-2">
                        Only unlocked content is visible
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
