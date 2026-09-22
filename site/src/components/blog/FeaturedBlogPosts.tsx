import { sanityService } from '@/lib/sanity/service';
import { BlogCard } from './BlogCard';

export async function FeaturedBlogPosts() {
  let featuredPosts;

  try {
    featuredPosts = await sanityService.getFeaturedBlogPosts();
  } catch (error) {
    console.error('Error fetching featured blog posts:', error);
    return (
      <div className="text-center text-gray-400 py-8">
        <p>Unable to load featured posts at this time.</p>
      </div>
    );
  }

  if (featuredPosts.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>No featured posts available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {featuredPosts.map((post) => (
        <BlogCard key={post._id} post={post} featured />
      ))}
    </div>
  );
}