import { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPost } from "@/components/blog/BlogPost";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { BlogBreadcrumb } from "@/components/blog/BlogBreadcrumb";
import { sanityService } from "@/lib/sanity/service";
import { BlogPostPageProps } from "@/types";

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await sanityService.getBlogPostBySlug(slug);

    if (!post) {
      return {
        title: "Post Not Found | QPG Blog",
        description: "The requested blog post could not be found.",
      };
    }

    return {
      title: post.seoTitle || `${post.title} | QPG Blog`,
      description:
        post.seoDescription ||
        post.excerpt ||
        "Read this insightful article on cannabis cultivation.",
      keywords: post.tags || [],
      openGraph: {
        title: post.title,
        description: post.excerpt || "",
        images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : [],
        type: "article",
        publishedTime: post.publishedAt,
        authors:
          post.author &&
          typeof post.author === "object" &&
          "name" in post.author
            ? [post.author.name]
            : [],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt || "",
        images: post.featuredImageUrl ? [post.featuredImageUrl] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Blog Post | QPG",
      description: "Cannabis cultivation insights and expert tips.",
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  let post;
  let relatedPosts = [];

  const { slug } = await params;

  try {
    post = await sanityService.getBlogPostBySlug(slug);

    if (!post) {
      notFound();
    }

    // Get related posts based on categories and tags
    const categoryIds =
      post.categories?.map((cat) =>
        typeof cat === "object" && "_id" in cat ? cat._id : cat._ref
      ) || [];

    relatedPosts = await sanityService.getRelatedBlogPosts(
      post._id,
      categoryIds,
      post.tags || []
    );
  } catch (error) {
    console.error("Error fetching blog post:", error);
    notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-8">
        <BlogBreadcrumb postTitle={post.title} categories={post.categories} />
      </div>

      {/* Blog Post Content */}
      <BlogPost post={post} />

      {/* Related Posts */}
      {relatedPosts.length > 0 && <RelatedPosts posts={relatedPosts} />}
    </div>
  );
}
