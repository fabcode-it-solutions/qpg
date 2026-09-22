import { client } from "./client";
import { unstable_cache } from "next/cache";
import { performanceMonitor } from "@/lib/utils/performance-monitor";
import {
  categoriesQuery,
  categoryBySlugQuery,
  coursesQuery,
  coursesListQuery,
  coursesPaginatedQuery,
  coursesCountQuery,
  coursesByCategoryQuery,
  coursesByCategoryPaginatedQuery,
  coursesByCategoryCountQuery,
  courseBySlugQuery,
  courseByIdQuery,
  videosByCourseQuery,
  videoBySlugQuery,
  videoByIdQuery,
  searchCoursesQuery,
  featuredCoursesQuery,
  blogPostsQuery,
  blogPostsPaginatedQuery,
  blogPostsCountQuery,
  featuredBlogPostsQuery,
  blogPostsByCategoryQuery,
  blogPostBySlugQuery,
  relatedBlogPostsQuery,
  searchBlogPostsQuery,
  siteSettingsQuery,
  instructorsQuery,
  instructorBySlugQuery,
} from "./queries";
import {
  SanityCategory,
  SanityCourse,
  SanityVideo,
  SanityInstructor,
  SanityBlogPost,
  SanitySiteSettings,
  TransformedCourse,
  TransformedVideo,
  TransformedCategory,
} from "./types";

export class SanityService {
  // Request deduplication cache to prevent duplicate API calls
  private requestCache = new Map<string, Promise<any>>();

  // Helper to deduplicate concurrent requests
  private async dedupedFetch<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    if (this.requestCache.has(key)) {
      return this.requestCache.get(key)!;
    }

    const promise = fetcher().finally(() => {
      // Clean up cache after request completes
      setTimeout(() => this.requestCache.delete(key), 1000);
    });

    this.requestCache.set(key, promise);
    return promise;
  }

  // Transform Sanity course to frontend format
  private transformCourse(course: SanityCourse): TransformedCourse {
    if (!course || !course._id) {
      console.error("Invalid course data received:", course);
      throw new Error("Invalid course data");
    }
    return {
      id: course._id,
      title: course.title,
      slug: course.slug.current,
      description: course.description
        ? this.richTextToPlainText(course.description)
        : undefined,
      shortDescription: course.shortDescription,
      thumbnailUrl: course.thumbnailUrl,
      heroImageUrl: course.heroImageUrl,
      galleryImages: course.galleryImages,
      price: course.price.toString(),
      originalPrice: course.originalPrice?.toString(),
      stripePriceId: course.stripePriceId,
      category:
        course.category &&
        typeof course.category === "object" &&
        "name" in course.category
          ? course.category.name
          : undefined,
      categorySlug:
        course.category &&
        typeof course.category === "object" &&
        "slug" in course.category
          ? course.category.slug.current
          : undefined,
      categoryColor:
        course.category &&
        typeof course.category === "object" &&
        "color" in course.category
          ? course.category.color
          : undefined,
      difficulty: course.difficulty,
      duration: course.estimatedDuration,
      estimatedDuration: course.estimatedDuration,
      instructor:
        typeof course.instructor === "object" &&
        course.instructor !== null &&
        "name" in course.instructor
          ? {
              name: course.instructor.name,
              avatarUrl: course.instructor.avatarUrl,
              title: course.instructor.professionalTitle,
            }
          : undefined,
      isPublished: course.isPublished,
      isFeatured: course.isFeatured,
      publishedAt: course.publishedAt,
      order: course.order,
      learningOutcomes: course.learningOutcomes,
      prerequisites: course.prerequisites,
      tags: course.tags,
      seoTitle: course.seoTitle,
      seoDescription: course.seoDescription,
      progressiveUnlock: course.progressiveUnlock,
    };
  }

  // Transform Sanity video to frontend format
  private transformVideo(video: SanityVideo): TransformedVideo {
    if (!video || !video._id) {
      console.error("Invalid video data received:", video);
      throw new Error("Invalid video data");
    }
    return {
      id: video._id,
      title: video.title,
      slug: video.slug.current,
      description: video.description
        ? this.richTextToPlainText(video.description)
        : undefined,
      courseId:
        typeof video.course === "object" && "_id" in video.course
          ? video.course._id
          : video.course._ref,
      unlockSettings: video.unlockSettings,
      transcript: video.transcript,
      keyPoints: video.keyPoints,
      resources: video.resources,
      bunnyVideoId: video.bunnyVideoId,
      bunnyLibraryId: video.bunnyLibraryId,
      bunnyCollectionId: video.bunnyCollectionId,
      bunnyStreamUrl: video.bunnyStreamUrl,
      bunnyThumbnailUrl: video.bunnyThumbnailUrl,
      bunnyVideoStatus: video.bunnyVideoStatus,
      bunnyEncodingProgress: video.bunnyEncodingProgress,
      order: video.order,
      isPublished: video.isPublished,
      isFree: video.isFree,
      isDownloadable: video.isDownloadable,
      publishedAt: video.publishedAt,
      duration: video.duration,
      width: video.width,
      height: video.height,
      fileSize: video.fileSize,
      bitrate: video.bitrate,
      framerate: video.framerate,
      codec: video.codec,
      quality: video.quality,
      customThumbnailUrl: video.customThumbnailUrl,
      tags: video.tags,
    };
  }

  // Transform Sanity category to frontend format
  private transformCategory(category: SanityCategory): TransformedCategory {
    return {
      id: category._id,
      name: category.name,
      slug: category.slug.current,
      description: category.description,
      iconUrl: category.iconUrl,
      color: category.color,
      order: category.order,
      isActive: category.isActive,
    };
  }

  // Helper to convert rich text to plain text
  private richTextToPlainText(blocks: any[]): string {
    return blocks
      .filter((block) => block._type === "block")
      .map(
        (block) =>
          block.children
            ?.filter((child: any) => child._type === "span")
            ?.map((span: any) => span.text)
            ?.join("") || ""
      )
      .join("\n\n");
  }

  // Category methods with long-term caching (categories rarely change)
  async getAllCategories(): Promise<TransformedCategory[]> {
    return this.getAllCategoriesCached();
  }

  private getAllCategoriesCached = unstable_cache(
    async (): Promise<TransformedCategory[]> => {
      return await performanceMonitor.trackSanityCall(
        "getAllCategories",
        async () => {
          const categories = await client.fetch<SanityCategory[]>(
            categoriesQuery
          );
          return categories.map((category) => this.transformCategory(category));
        },
        true
      );
    },
    ["all-categories"],
    { revalidate: 3600, tags: ["sanity"] } // 1 hour - categories change infrequently
  );

  async getCategoryBySlug(slug: string): Promise<TransformedCategory | null> {
    const category = await client.fetch<SanityCategory | null>(
      categoryBySlugQuery,
      { slug }
    );
    return category ? this.transformCategory(category) : null;
  }

  // Course methods - lightweight version for listings
  async getAllCoursesLight(): Promise<TransformedCourse[]> {
    return this.dedupedFetch("courses-light", async () => {
      return await performanceMonitor.trackSanityCall(
        "getAllCoursesLight",
        async () => {
          const courses = await client.fetch<SanityCourse[]>(coursesListQuery);
          return courses.map((course) => this.transformCourse(course));
        }
      );
    });
  }

  // Full course data (use sparingly)
  async getAllCourses(): Promise<TransformedCourse[]> {
    return this.dedupedFetch("courses-full", async () => {
      return await performanceMonitor.trackSanityCall(
        "getAllCourses",
        async () => {
          const courses = await client.fetch<SanityCourse[]>(coursesQuery);
          return courses.map((course) => this.transformCourse(course));
        }
      );
    });
  }

  // Paginated course methods
  async getAllCoursesPaginated(
    page: number = 1,
    limit: number = 12
  ): Promise<{
    courses: TransformedCourse[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const start = (page - 1) * limit;
    const end = start + limit;

    // Run both queries in parallel
    const [courses, total] = await Promise.all([
      client.fetch<SanityCourse[]>(coursesPaginatedQuery, { start, end }),
      client.fetch<number>(coursesCountQuery),
    ]);

    return {
      courses: courses.map((course) => this.transformCourse(course)),
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async getCoursesByCategory(categoryId: string): Promise<TransformedCourse[]> {
    const courses = await client.fetch<SanityCourse[]>(coursesByCategoryQuery, {
      categoryId,
    });
    return courses.map((course) => this.transformCourse(course));
  }

  // Paginated courses by category
  async getCoursesByCategoryPaginated(
    categoryId: string,
    page: number = 1,
    limit: number = 12
  ): Promise<{
    courses: TransformedCourse[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const start = (page - 1) * limit;
    const end = start + limit;

    // Run both queries in parallel
    const [courses, total] = await Promise.all([
      client.fetch<SanityCourse[]>(coursesByCategoryPaginatedQuery, {
        categoryId,
        start,
        end,
      }),
      client.fetch<number>(coursesByCategoryCountQuery, { categoryId }),
    ]);

    return {
      courses: courses.map((course) => this.transformCourse(course)),
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async getCourseBySlug(slug: string): Promise<TransformedCourse | null> {
    const course = await client.fetch<SanityCourse | null>(courseBySlugQuery, {
      slug,
    });
    return course ? this.transformCourse(course) : null;
  }

  async getCourseById(courseId: string): Promise<TransformedCourse | null> {
    return await this.getCourseByIdCached(courseId);
  }

  // Cached version with longer revalidation to reduce API calls
  private getCourseByIdCached = unstable_cache(
    async (courseId: string): Promise<TransformedCourse | null> => {
      return await performanceMonitor.trackSanityCall(
        "getCourseById",
        async () => {
          const course = await client.fetch<SanityCourse | null>(
            courseByIdQuery,
            {
              courseId,
            }
          );
          return course ? this.transformCourse(course) : null;
        },
        true // This is cached
      );
    },
    ["course-by-id"],
    { revalidate: 1800, tags: ["sanity"] } // 30 minutes - courses don't change frequently
  );

  async getCourseWithVideos(
    courseId: string
  ): Promise<(TransformedCourse & { videos: TransformedVideo[] }) | null> {
    try {
      // First get the course
      const course = await this.getCourseById(courseId);
      if (!course) return null;

      // Then get the videos
      const videos = await this.getVideosByCourse(courseId);

      return {
        ...course,
        videos,
      };
    } catch (error) {
      console.error(`Error fetching course with videos (${courseId}):`, error);
      throw error; // Re-throw to let hybrid service handle fallback
    }
  }

  async searchCourses(searchTerm: string): Promise<TransformedCourse[]> {
    const courses = await client.fetch<SanityCourse[]>(searchCoursesQuery, {
      searchTerm: `*${searchTerm}*`,
    });
    return courses.map((course) => this.transformCourse(course));
  }

  async getFeaturedCourses(): Promise<TransformedCourse[]> {
    const courses = await client.fetch<SanityCourse[]>(featuredCoursesQuery);
    return courses.map((course) => this.transformCourse(course));
  }

  // Video methods
  async getVideosByCourse(courseId: string): Promise<TransformedVideo[]> {
    return await this.getVideosByCourseCached(courseId);
  }

  // Cached version with longer revalidation to reduce bandwidth usage
  private getVideosByCourseCached = unstable_cache(
    async (courseId: string): Promise<TransformedVideo[]> => {
      return await performanceMonitor.trackSanityCall(
        "getVideosByCourse",
        async () => {
          try {
            const videos = await client.fetch<SanityVideo[]>(
              videosByCourseQuery,
              {
                courseId,
              }
            );

            if (!Array.isArray(videos)) {
              return [];
            }

            return videos
              .filter((video) => video && video._id) // Filter out null/invalid videos
              .map((video) => {
                try {
                  return this.transformVideo(video);
                } catch (transformError) {
                  return null;
                }
              })
              .filter(Boolean) as TransformedVideo[]; // Remove any null results
          } catch (error) {
            return [];
          }
        },
        true // This is cached
      );
    },
    ["videos-by-course"],
    { revalidate: 1800, tags: ["sanity"] } // 30 minutes - video lists don't change frequently
  );

  async getVideoBySlug(slug: string): Promise<TransformedVideo | null> {
    const video = await client.fetch<SanityVideo | null>(videoBySlugQuery, {
      slug,
    });
    return video ? this.transformVideo(video) : null;
  }

  async getVideoById(videoId: string): Promise<TransformedVideo | null> {
    return await this.getVideoByIdCached(videoId);
  }

  // Cached version with 5-minute revalidation
  private getVideoByIdCached = unstable_cache(
    async (videoId: string): Promise<TransformedVideo | null> => {
      const video = await client.fetch<SanityVideo | null>(videoByIdQuery, {
        videoId,
      });
      return video ? this.transformVideo(video) : null;
    },
    ["video-by-id"],
    { revalidate: 300, tags: ["sanity"] } // 5 minutes
  );

  // Blog methods with caching and pagination
  async getAllBlogPosts(): Promise<SanityBlogPost[]> {
    return this.getAllBlogPostsCached();
  }

  private getAllBlogPostsCached = unstable_cache(
    async (): Promise<SanityBlogPost[]> => {
      return await performanceMonitor.trackSanityCall(
        "getAllBlogPosts",
        async () => {
          return await client.fetch<SanityBlogPost[]>(blogPostsQuery);
        },
        true
      );
    },
    ["all-blog-posts"],
    { revalidate: 1800, tags: ["sanity"] } // 30 minutes
  );

  async getBlogPostsPaginated(
    page: number = 1,
    limit: number = 9
  ): Promise<{
    posts: SanityBlogPost[];
    total: number;
    totalPages: number;
    currentPage: number;
  }> {
    const start = (page - 1) * limit;
    const end = start + limit;

    const [posts, total] = await Promise.all([
      client.fetch<SanityBlogPost[]>(blogPostsPaginatedQuery, { start, end }),
      client.fetch<number>(blogPostsCountQuery),
    ]);

    return {
      posts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  }

  async getFeaturedBlogPosts(): Promise<SanityBlogPost[]> {
    return this.getFeaturedBlogPostsCached();
  }

  private getFeaturedBlogPostsCached = unstable_cache(
    async (): Promise<SanityBlogPost[]> => {
      return await performanceMonitor.trackSanityCall(
        "getFeaturedBlogPosts",
        async () => {
          return await client.fetch<SanityBlogPost[]>(featuredBlogPostsQuery);
        },
        true
      );
    },
    ["featured-blog-posts"],
    { revalidate: 3600, tags: ["sanity"] } // 1 hour
  );

  async getBlogPostsByCategory(categoryId: string): Promise<SanityBlogPost[]> {
    return await client.fetch<SanityBlogPost[]>(blogPostsByCategoryQuery, {
      categoryId,
    });
  }

  async getBlogPostBySlug(slug: string): Promise<SanityBlogPost | null> {
    return await this.getBlogPostBySlugCached(slug);
  }

  private getBlogPostBySlugCached = unstable_cache(
    async (slug: string): Promise<SanityBlogPost | null> => {
      return await performanceMonitor.trackSanityCall(
        "getBlogPostBySlug",
        async () => {
          return await client.fetch<SanityBlogPost | null>(
            blogPostBySlugQuery,
            {
              slug,
            }
          );
        },
        true
      );
    },
    ["blog-post-by-slug"],
    { revalidate: 1800, tags: ["sanity"] } // 30 minutes
  );

  async getRelatedBlogPosts(
    currentPostId: string,
    categoryIds: string[],
    tags: string[]
  ): Promise<SanityBlogPost[]> {
    return await client.fetch<SanityBlogPost[]>(relatedBlogPostsQuery, {
      currentPostId,
      categoryIds,
      tags,
    });
  }

  async searchBlogPosts(searchTerm: string): Promise<SanityBlogPost[]> {
    return await client.fetch<SanityBlogPost[]>(searchBlogPostsQuery, {
      searchTerm: `*${searchTerm}*`,
    });
  }

  // Site settings with aggressive caching (rarely changes)
  async getSiteSettings(): Promise<SanitySiteSettings | null> {
    return this.getSiteSettingsCached();
  }

  private getSiteSettingsCached = unstable_cache(
    async (): Promise<SanitySiteSettings | null> => {
      return await performanceMonitor.trackSanityCall(
        "getSiteSettings",
        async () => {
          return await client.fetch<SanitySiteSettings | null>(
            siteSettingsQuery
          );
        },
        true
      );
    },
    ["site-settings"],
    { revalidate: 7200, tags: ["sanity"] } // 2 hours - site settings change very rarely
  );

  // Instructor methods
  async getAllInstructors(): Promise<SanityInstructor[]> {
    return await client.fetch<SanityInstructor[]>(instructorsQuery);
  }

  async getInstructorBySlug(slug: string): Promise<SanityInstructor | null> {
    return await client.fetch<SanityInstructor | null>(instructorBySlugQuery, {
      slug,
    });
  }

  // Utility methods
  async previewMode(token?: string) {
    // For preview mode, you can use a different client with token
    // This is useful for previewing unpublished content
    if (token) {
      // Return a new client instance with preview token
      // Implementation depends on your preview setup
    }
  }
}

// Export singleton instance
export const sanityService = new SanityService();
