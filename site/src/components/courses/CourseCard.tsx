"use client";

import Link from "next/link";
import { memo } from "react";
import { CourseCardProps } from "@/types/course";
import { cn } from "@/lib/utils/utils";
import { truncateWords } from "@/lib/utils/sanitize";

export const CourseCard = memo(function CourseCard({
  course,
}: CourseCardProps) {
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "--";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  return (
    <Link href={`/courses/${course.id}`}>
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer group">
        <div className="relative">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-48 bg-white/5 flex items-center justify-center">
              <span className="text-white/50">No Image</span>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-(--color-gold) px-3 py-1 rounded-full text-sm font-medium">
            {formatPrice(course.price)}
          </div>
          {course.difficulty && (
            <div className="absolute top-3 left-3 bg-black/20 backdrop-blur-sm text-(--color-gold) border border-(--color-gold)/30 px-3 py-1 rounded-full text-xs font-medium capitalize">
              {course.difficulty}
            </div>
          )}
        </div>

        <div className="p-6">
          <h3
            className={cn(
              "text-lg font-semibold text-white mb-2 line-clamp-2 truncate",
              "group-hover:text-(--color-gold) transition-colors duration-200"
            )}
          >
            {course.title}
          </h3>

          {course.shortDescription && (
            <p className="text-white/70 text-sm mb-4 line-clamp-2">
              {course.shortDescription}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/60">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatDuration(course.duration)}</span>
            </div>
            {course.category && (
              <span className="bg-white/10 text-white/80 px-3 py-1 rounded-full text-xs font-medium">
                {truncateWords(course.category, 10)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});
