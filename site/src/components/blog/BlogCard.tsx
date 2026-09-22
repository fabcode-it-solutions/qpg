"use client";

import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ClockLucideIcon } from "@/components/icons";
import { BlogCardProps } from "@/types";

export const BlogCard = memo(function BlogCard({
  post,
  featured = false,
}: BlogCardProps) {
  const cardClasses = featured
    ? "group hover:scale-105 transition-all duration-300 border-[var(--color-gold)]/20"
    : "group hover:scale-105 transition-all duration-300";

  return (
    <Link href={`/blog/${post.slug.current}`}>
      <GlassCard className={cardClasses}>
        {/* Featured Image */}
        {post.featuredImageUrl && (
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            <Image
              src={post.featuredImageUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {featured && (
              <div className="absolute top-4 left-4">
                <span className="bg-[var(--color-gold)] text-black px-3 py-1 rounded-full text-sm font-semibold">
                  Featured
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-2">
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.categories.slice(0, 2).map((category, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 rounded-full border"
                  style={{
                    borderColor:
                      typeof category === "object" && "color" in category
                        ? category.color || "var(--color-gold)"
                        : "var(--color-gold)",
                    color:
                      typeof category === "object" && "color" in category
                        ? category.color || "var(--color-gold)"
                        : "var(--color-gold)",
                  }}
                >
                  {typeof category === "object" && "name" in category
                    ? category.name
                    : "Category"}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-[var(--color-gold)] transition-colors duration-300 line-clamp-2">
            {post.title}
          </h3>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
              {post.excerpt}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              {/* Author */}
              {post.author &&
                typeof post.author === "object" &&
                "name" in post.author && <span>By {post.author.name}</span>}

              {/* Reading Time */}
              {post.readingTime && (
                <div className="flex items-center">
                  <ClockLucideIcon className="w-4 h-4 mr-1" />
                  <span>{post.readingTime} min read</span>
                </div>
              )}
            </div>

            {/* Date */}
            {/* {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>} */}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
});
