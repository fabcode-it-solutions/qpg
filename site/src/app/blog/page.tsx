import { Suspense } from "react";
import { Metadata } from "next";

import { ContentSection } from "@/components/ui/ContentSection";
import { LazyBlogGrid, LazyFeaturedBlogPosts } from "@/components/lazy";
import { BlogSearch } from "@/components/blog/BlogSearch";
import { BlogCategories } from "@/components/blog/BlogCategories";
import { BlogPagination } from "@/components/blog/BlogPagination";
import { sanityService } from "@/lib/sanity/service";
import { TransformedCategory } from "@/lib/sanity";
import { BlogPageProps } from "@/types";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Blog | QPG - Cannabis Cultivation Insights",
    description:
      "Discover expert insights, tips, and techniques for cannabis cultivation. Stay updated with the latest trends and best practices.",
    keywords: [
      "cannabis cultivation",
      "growing tips",
      "cultivation blog",
      "cannabis education",
    ],
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page, search, category } = await searchParams;
  const searchTerm = search;
  const categoryId = category;

  // Fetch blog data based on filters
  let blogData;
  let categories: TransformedCategory[] = [];

  try {
    if (searchTerm) {
      // Search posts
      const posts = await sanityService.searchBlogPosts(searchTerm);
      blogData = {
        posts,
        total: posts.length,
        totalPages: 1,
        currentPage: 1,
      };
    } else if (categoryId) {
      // Filter by category
      const posts = await sanityService.getBlogPostsByCategory(categoryId);
      blogData = {
        posts,
        total: posts.length,
        totalPages: 1,
        currentPage: 1,
      };
    } else {
      // Regular paginated posts
      blogData = await sanityService.getBlogPostsPaginated(
        parseInt(page || "1"),
        9
      );
    }

    // Get all categories and filter only those with posts
    const allCategories = await sanityService.getAllCategories();
    const categoriesWithPosts = await Promise.all(
      allCategories.map(async (cat) => {
        const posts = await sanityService.getBlogPostsByCategory(cat.id);
        return posts.length > 0 ? cat : null;
      })
    );
    categories = categoriesWithPosts.filter(Boolean) as TransformedCategory[];
  } catch (error) {
    console.error("Error fetching blog data:", error);
    blogData = {
      posts: [],
      total: 0,
      totalPages: 0,
      currentPage: 1,
    };
    categories = [];
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black py-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-gold)] mb-4">
              {searchTerm
                ? `Search Results for "${searchTerm}"`
                : categoryId
                ? "Category Posts"
                : "Cannabis Cultivation Blog"}
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
              Discover the latest techniques, tips, and insights from cannabis
              cultivation experts
            </p>
            {blogData.total > 0 && (
              <p className="text-sm text-white/60 mt-3">
                Showing {blogData.posts.length} of {blogData.total} articles
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div id="blog-section">
        <ContentSection background="subtle">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Search */}
                <BlogSearch initialSearch={searchTerm} />

                {/* Categories */}
                <BlogCategories
                  categories={categories}
                  selectedCategory={categoryId}
                  scrollToSection={true}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-8">
                {/* Results Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {searchTerm
                        ? `Search Results for "${searchTerm}"`
                        : categoryId
                        ? "Category Posts"
                        : "All Articles"}
                    </h2>
                    <p className="text-gray-400 mt-1">
                      {blogData.total}{" "}
                      {blogData.total === 1 ? "article" : "articles"} found
                    </p>
                  </div>
                </div>

                {/* Blog Grid */}
                <Suspense
                  fallback={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-white/5 rounded-lg h-64 animate-pulse"
                        />
                      ))}
                    </div>
                  }
                >
                  <LazyBlogGrid posts={blogData.posts} />
                </Suspense>

                {/* Pagination */}
                {blogData.totalPages > 1 && !searchTerm && !categoryId && (
                  <BlogPagination
                    currentPage={blogData.currentPage}
                    totalPages={blogData.totalPages}
                    total={blogData.total}
                  />
                )}

                {/* No Results */}
                {blogData.posts.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg
                        className="w-16 h-16 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No articles found
                    </h3>
                    <p className="text-gray-400 mb-6">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Check back soon for new content"}
                    </p>
                    {(searchTerm || categoryId) && (
                      <a
                        href="/blog"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold)]/80 text-black font-semibold rounded-lg hover:from-[var(--color-gold)]/90 hover:to-[var(--color-gold)]/70 transition-all duration-300"
                      >
                        View All Articles
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ContentSection>
      </div>
      {/* Featured Posts Section */}
      {!searchTerm && !categoryId && parseInt(page || "1") === 1 && (
        <ContentSection
          title="Featured Articles"
          subtitle="Don't miss these essential reads"
          centerText
        >
          <Suspense
            fallback={
              <div className="text-center text-gray-400">
                Loading featured posts...
              </div>
            }
          >
            <LazyFeaturedBlogPosts />
          </Suspense>
        </ContentSection>
      )}
    </div>
  );
}
