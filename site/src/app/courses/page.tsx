import { Suspense } from "react";
import { LazyCourseGrid } from "@/components/lazy";
import { CoursePageSync } from "@/components/courses/CoursePageSync";
import { CategoryDropdown } from "@/components/courses/CategoryDropdown";
import { hybridCourseService } from "@/lib/services/hybrid-course.service";
import { Course, Category } from "@/types/course";

const courseService = hybridCourseService;

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; page?: string }>;
}) {
  const {
    category: categorySlug,
    search,
    page: pageParam,
  } = await searchParams;
  const page = parseInt(pageParam || "1");

  // Fetch all categories for the filter bar
  let categories: Category[] = [];
  try {
    categories = await courseService.getAllCategories();
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  let courses: Course[] = [];
  let currentCategory: Category | null = null;
  let totalPages = 1;
  let total = 0;

  try {
    if (search) {
      // Search courses by query (no pagination for search yet)
      courses = await courseService.searchCourses(search);
      total = courses.length;
      totalPages = 1;
    } else if (categorySlug) {
      // Get category by slug
      currentCategory = await courseService.getCategoryBySlug(categorySlug);

      if (currentCategory) {
        // Get courses by category ID with pagination
        const result = await courseService.getCoursesByCategoryID(
          currentCategory.id,
          page
        );
        courses = result.courses;
        total = result.total;
        totalPages = result.totalPages;
      }
    } else {
      // Get all published courses with pagination
      const result = await courseService.getAllPublishedCourses(page);
      courses = result.courses;
      total = result.total;
      totalPages = result.totalPages;
    }
  } catch (error) {
    console.error("Error fetching courses:", error);
  }

  return (
    <div className="min-h-screen bg-black">
      <CoursePageSync />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black py-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-(--color-gold) mb-4">
              {search
                ? `Search Results for "${search}"`
                : currentCategory
                ? `${currentCategory.name} Courses`
                : "All Courses"}
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Discover our comprehensive video courses and start learning today
            </p>
            {total > 0 && (
              <p className="text-sm text-white/60 mt-3">
                Showing {courses.length} of {total} courses
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-8 relative z-50">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 overflow-visible">
            <h3 className="text-lg font-medium text-white mb-4">
              Filter by Category
            </h3>

            {/* Mobile Dropdown */}
            <div className="block md:hidden relative z-50">
              <CategoryDropdown
                categories={categories}
                currentCategory={categorySlug}
              />
            </div>

            {/* Desktop Horizontal Links */}
            <div className="hidden md:flex flex-wrap gap-3">
              <a
                href="/courses"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !categorySlug
                    ? "bg-(--color-gold) text-black"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                }`}
              >
                All Courses
              </a>
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/courses?category=${encodeURIComponent(cat.slug)}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    categorySlug === cat.slug
                      ? "bg-(--color-gold) text-black"
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                  }`}
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl h-80 animate-pulse"
                />
              ))}
            </div>
          }
        >
          <LazyCourseGrid
            courses={courses}
            category={currentCategory?.name}
            searchQuery={search}
          />
        </Suspense>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                {/* Previous button */}
                {page > 1 && (
                  <a
                    href={`/courses?${new URLSearchParams({
                      ...(categorySlug && { category: categorySlug }),
                      ...(search && { search }),
                      page: (page - 1).toString(),
                    })}`}
                    className="px-4 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Previous
                  </a>
                )}

                {/* Page numbers */}
                {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                  const pageNum = Math.max(1, page - 2) + index;
                  if (pageNum > totalPages) return null;

                  return (
                    <a
                      key={pageNum}
                      href={`/courses?${new URLSearchParams({
                        ...(categorySlug && { category: categorySlug }),
                        ...(search && { search }),
                        page: pageNum.toString(),
                      })}`}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        pageNum === page
                          ? "bg-(--color-gold) text-black"
                          : "text-white bg-white/10 border border-white/20 hover:bg-white/20"
                      }`}
                    >
                      {pageNum}
                    </a>
                  );
                })}

                {/* Next button */}
                {page < totalPages && (
                  <a
                    href={`/courses?${new URLSearchParams({
                      ...(categorySlug && { category: categorySlug }),
                      ...(search && { search }),
                      page: (page + 1).toString(),
                    })}`}
                    className="px-4 py-2 text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
