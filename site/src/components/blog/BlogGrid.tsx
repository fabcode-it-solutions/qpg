"use client";

import { memo } from "react";
import { BlogGridProps } from "@/types";
import { BlogCard } from "./BlogCard";

export const BlogGrid = memo(function BlogGrid({ posts }: BlogGridProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <BlogCard key={`${post._id}-${post.slug?.current || ""}`} post={post} />
      ))}
    </div>
  );
});
