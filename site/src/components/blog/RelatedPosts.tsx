import { ContentSection } from "@/components/ui/ContentSection";
import { BlogCard } from "./BlogCard";
import { RelatedPostsProps } from "@/types";

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  // Filter out invalid posts and add error handling
  const validPosts = posts.filter((post) => {
    if (!post || !post._id) {
      console.warn('Invalid post data found in RelatedPosts');
      return false;
    }
    return true;
  });

  if (validPosts.length === 0) {
    return null;
  }

  return (
    <ContentSection
      title="Related Articles"
      subtitle="Continue reading"
      background="subtle"
      centerText
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {validPosts.map((post) => (
          <BlogCard key={post._id} post={post} />
        ))}
      </div>
    </ContentSection>
  );
}
