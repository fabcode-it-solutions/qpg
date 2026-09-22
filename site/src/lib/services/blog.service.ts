import { unstable_cache } from "next/cache";
import { sanityService } from "@/lib/sanity/service";
import { SanityBlogPost } from "@/lib/sanity/types";

export class BlogService {
  // Cache keys for different blog operations
  private static readonly CACHE_KEYS = {
    ALL_POSTS: "blog-all-posts",
    FEATURED_POSTS: "blog-featured-posts",
    POST_BY_SLUG: "blog-post-by-slug",
    POSTS_BY_CATEGORY: "blog-posts-by-category",
    SEARCH_POSTS: "blog-search-posts",
    RELATED_POSTS: "blog-related-posts",
  };

  // Cache durations (in seconds)
  private static readonly CACHE_DURATIONS = {
    POSTS_LIST: 1800, // 30 minutes
    FEATURED_POSTS: 3600, // 1 hour
    INDIVIDUAL_POST: 1800, // 30 minutes
    SEARCH_RESULTS: 900, // 15 minutes
  };

  /**
   * Get all blog posts with pagination
   */
  async getAllPosts(page: number = 1, limit: number = 9) {
    return await sanityService.getBlogPostsPaginated(page, limit);
  }

  /**
   * Get featured blog posts (cached for 1 hour)
   */
  getFeaturedPosts = unstable_cache(
    async (): Promise<SanityBlogPost[]> => {
      try {
        return await sanityService.getFeaturedBlogPosts();
      } catch (error) {
        console.error("Error fetching featured blog posts:", error);
        return [];
      }
    },
    [BlogService.CACHE_KEYS.FEATURED_POSTS],
    {
      revalidate: BlogService.CACHE_DURATIONS.FEATURED_POSTS,
      tags: ["blog-posts", "featured-posts", "sanity"],
    }
  );

  /**
   * Get blog post by slug (cached for 30 minutes)
   */
  getPostBySlug = unstable_cache(
    async (slug: string): Promise<SanityBlogPost | null> => {
      try {
        return await sanityService.getBlogPostBySlug(slug);
      } catch (error) {
        console.error(`Error fetching blog post by slug ${slug}:`, error);
        return null;
      }
    },
    [BlogService.CACHE_KEYS.POST_BY_SLUG],
    {
      revalidate: BlogService.CACHE_DURATIONS.INDIVIDUAL_POST,
      tags: ["blog-posts", "sanity"],
    }
  );

  /**
   * Get blog posts by category
   */
  async getPostsByCategory(categoryId: string): Promise<SanityBlogPost[]> {
    try {
      return await sanityService.getBlogPostsByCategory(categoryId);
    } catch (error) {
      console.error(
        `Error fetching blog posts by category ${categoryId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Search blog posts (cached for 15 minutes)
   */
  searchPosts = unstable_cache(
    async (searchTerm: string): Promise<SanityBlogPost[]> => {
      try {
        if (!searchTerm.trim()) {
          return [];
        }
        return await sanityService.searchBlogPosts(searchTerm);
      } catch (error) {
        console.error(`Error searching blog posts for "${searchTerm}":`, error);
        return [];
      }
    },
    [BlogService.CACHE_KEYS.SEARCH_POSTS],
    {
      revalidate: BlogService.CACHE_DURATIONS.SEARCH_RESULTS,
      tags: ["blog-posts", "search", "sanity"],
    }
  );

  /**
   * Get related blog posts
   */
  async getRelatedPosts(
    currentPostId: string,
    categoryIds: string[],
    tags: string[]
  ): Promise<SanityBlogPost[]> {
    try {
      return await sanityService.getRelatedBlogPosts(
        currentPostId,
        categoryIds,
        tags
      );
    } catch (error) {
      console.error(
        `Error fetching related posts for ${currentPostId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get blog statistics
   */
  async getBlogStats() {
    try {
      const [allPosts, featuredPosts] = await Promise.all([
        sanityService.getAllBlogPosts(),
        this.getFeaturedPosts(),
      ]);

      return {
        totalPosts: allPosts.length,
        featuredPosts: featuredPosts.length,
        publishedPosts: allPosts.filter((post) => post.isPublished).length,
      };
    } catch (error) {
      console.error("Error fetching blog statistics:", error);
      return {
        totalPosts: 0,
        featuredPosts: 0,
        publishedPosts: 0,
      };
    }
  }

  /**
   * Validate blog post data
   */
  validatePost(post: SanityBlogPost): boolean {
    return !!(
      post &&
      post._id &&
      post.title &&
      post.slug?.current &&
      post.isPublished
    );
  }

  /**
   * Format blog post for display
   */
  formatPost(post: SanityBlogPost) {
    return {
      ...post,
      formattedDate: post.publishedAt
        ? new Date(post.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
      readingTimeText: post.readingTime ? `${post.readingTime} min read` : null,
      excerpt: post.excerpt || this.generateExcerpt(post.content),
    };
  }

  /**
   * Generate excerpt from content if not provided
   */
  private generateExcerpt(content: any[], maxLength: number = 160): string {
    if (!content || !Array.isArray(content)) {
      return "";
    }

    const textBlocks = content
      .filter((block) => block._type === "block")
      .map(
        (block) =>
          block.children
            ?.filter((child: any) => child._type === "span")
            ?.map((span: any) => span.text)
            ?.join("") || ""
      )
      .join(" ");

    return textBlocks.length > maxLength
      ? `${textBlocks.substring(0, maxLength)}...`
      : textBlocks;
  }

  /**
   * Get blog post URL
   */
  getPostUrl(slug: string): string {
    return `/blog/${slug}`;
  }

  /**
   * Get category filter URL
   */
  getCategoryUrl(categoryId: string): string {
    return `/blog?category=${categoryId}`;
  }

  /**
   * Get search URL
   */
  getSearchUrl(searchTerm: string): string {
    return `/blog?search=${encodeURIComponent(searchTerm)}`;
  }
}

// Export singleton instance
export const blogService = new BlogService();
