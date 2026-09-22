import { memo } from "react";
import { CourseGridProps } from "@/types/course";
import { CourseCard } from "./CourseCard";

const CourseGrid = memo(function CourseGrid({
  courses,
  searchQuery,
  category,
}: CourseGridProps) {
  function escapeHtml(str: string) {
    return str.replace(/[&<>"']/g, function (m) {
      switch (m) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return m;
      }
    });
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
        <p className="text-white/70 text-lg">
          {searchQuery
            ? `No courses found for "${escapeHtml(searchQuery)}"`
            : category
            ? `No courses found in "${escapeHtml(category)}" category`
            : "No courses available"}
        </p>
        <p className="text-white/50 text-sm mt-2">
          Try adjusting your search or browse all courses
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {(() => {
        try {
          return courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ));
        } catch (error) {
          return (
            <div className="col-span-full text-red-500 text-center">
              Failed to render courses. Please try again later.
            </div>
          );
        }
      })()}
    </div>
  );
});

export default CourseGrid;
