"use client";

import { CheckCircle2 } from "lucide-react";
import { Course, CourseWithVideos } from "@/types/course";
import { CourseStats } from "./CourseStats";
import { EnrollmentActions } from "./EnrollmentActions";

interface HeroEnrollmentCardProps {
  course: Course | CourseWithVideos;
  hasAccess: boolean;
  progress?: any;
}

export default function HeroEnrollmentCard({
  course,
  hasAccess,
  progress,
}: HeroEnrollmentCardProps) {
  if (hasAccess) {
    return (
      <div className="text-center">
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 lg:p-2 xl:p-6 mb-6">
          <div className="flex items-center justify-center gap-3 text-green-400 mb-4">
            <CheckCircle2 className="w-6 h-6" />
            <span className="font-semibold text-lg">Enrolled</span>
          </div>

          {progress && (
            <CourseStats
              completedVideos={progress.completedVideos || 0}
              totalVideos={
                progress.totalVideos ||
                ("videos" in course ? course.videos?.length : 0) ||
                0
              }
              totalWatchTime={progress.watchedDuration || 0}
              lastActivityAt={
                progress.lastActivityAt
                  ? new Date(progress.lastActivityAt)
                  : null
              }
            />
          )}
        </div>

        <EnrollmentActions
          courseId={course.id}
          price={course.price}
          hasAccess={hasAccess}
        />
      </div>
    );
  }

  return (
    <div className="text-center">
      <EnrollmentActions
        courseId={course.id}
        price={course.price}
        hasAccess={hasAccess}
      />
    </div>
  );
}
