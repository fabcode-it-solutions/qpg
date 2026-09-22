import { Suspense } from "react";
import Link from "next/link";
import { BlogCard } from "@/components/blog/BlogCard";
import { sanityService } from "@/lib/sanity/service";

async function BlogsContent() {
  let featuredPosts: any[] = [];
  
  try {
    featuredPosts = await sanityService.getFeaturedBlogPosts();
  } catch (error) {
    console.error('Error fetching featured blog posts:', error);
  }

  if (featuredPosts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-6">No blog posts available yet.</p>
        <p className="text-sm text-gray-500">Check back soon for cannabis cultivation insights!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {featuredPosts.slice(0, 3).map((post) => (
        <BlogCard key={post._id} post={post} featured />
      ))}
    </div>
  );
}

const OurBlogs = () => {
  return (
    <div className="pt-[100px] max-w-[1700px] w-full mx-auto flex flex-col font-[inter] px-4">
      <div className="font-bold text-[60px] flex justify-center relative mb-12">
        Our Blogs
        <div className="w-[200px] absolute bottom-0 h-[1px] bg-secondary" />
      </div>
      
      <Suspense fallback={
        <div className="text-center py-12">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/10 rounded-lg h-96"></div>
              ))}
            </div>
          </div>
        </div>
      }>
        <BlogsContent />
      </Suspense>

      <div className="text-center mt-12">
        <Link 
          href="/blog"
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold)]/80 text-black font-semibold rounded-lg hover:from-[var(--color-gold)]/90 hover:to-[var(--color-gold)]/70 transition-all duration-300"
        >
          View All Articles
        </Link>
      </div>

      <div className="w-full h-[1px] bg-primary/30 opacity-30 mt-[69px]" />
    </div>
  );
};

export default OurBlogs;