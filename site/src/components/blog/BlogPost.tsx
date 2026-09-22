"use client";

import Image from "next/image";
import { ContentSection } from "@/components/ui/ContentSection";
import { GlassCard } from "@/components/ui/GlassCard";
import { ClockLucideIcon } from "@/components/icons";
import { PortableText } from "@portabletext/react";
import { BlogPostProps } from "@/types";

// Portable Text components for rich content rendering
const portableTextComponents = {
  types: {
    image: ({ value }: any) => {
      // Validate image URL to allow only http(s) protocols
      const rawUrl =
        typeof value.asset?.url === "string" ? value.asset.url : "";
      const isSafeUrl = /^https?:\/\//i.test(rawUrl);
      const safeUrl = isSafeUrl ? rawUrl.replace(/[<>"'&]/g, "") : "";
      const safeAlt =
        typeof value.alt === "string" ? value.alt.replace(/[<>"'&]/g, "") : "";
      const safeCaption =
        typeof value.caption === "string"
          ? value.caption.replace(/[<>"'&]/g, "")
          : "";

      if (!isSafeUrl) {
        return (
          <div className="my-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400">Blocked potentially unsafe image URL</p>
          </div>
        );
      }

      return (
        <div className="my-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
          <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
            <Image
              src={safeUrl}
              alt={safeAlt}
              fill
              className="rounded-lg object-contain"
            />
          </div>
          {safeCaption && (
            <p className="text-sm text-gray-400 text-center mt-4 italic">
              {safeCaption}
            </p>
          )}
        </div>
      );
    },
    videoEmbed: ({ value }: any) => {
      // Sanitize URL to prevent XSS
      const sanitizedUrl =
        value.url && typeof value.url === "string"
          ? value.url.replace(/[<>"']/g, "")
          : "";

      // Only allow trusted video domains
      const allowedDomains = [
        "youtube.com",
        "youtu.be",
        "vimeo.com",
        "wistia.com",
      ];
      const isAllowedDomain = allowedDomains.some((domain) =>
        sanitizedUrl.includes(domain)
      );

      if (!isAllowedDomain) {
        return (
          <div className="my-8 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400">
              Video from untrusted domain blocked for security
            </p>
          </div>
        );
      }

      return (
        <div className="my-8">
          <div className="aspect-video">
            <iframe
              src={sanitizedUrl}
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
        </div>
      );
    },
  },
  block: {
    h2: ({ children }: any) => (
      <h2 className="text-3xl font-bold text-white mt-12 mb-6">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-2xl font-semibold text-white mt-10 mb-4">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-xl font-semibold text-white mt-8 mb-3">{children}</h4>
    ),
    normal: ({ children }: any) => (
      <p className="text-gray-300 leading-relaxed mb-6">{children}</p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-[var(--color-gold)] pl-6 my-8 italic text-gray-300 bg-white/5 py-4 rounded-r-lg">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-2 mb-6 text-gray-300 ml-4">
        {children}
      </ul>
    ),
    number: ({ children }: any) => (
      <ol className="list-decimal list-inside space-y-2 mb-6 text-gray-300 ml-4">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }: any) => (
      <strong className="font-semibold text-white">{children}</strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-[var(--color-gold)]">{children}</em>
    ),
    code: ({ children }: any) => (
      <code className="bg-gray-800 px-2 py-1 rounded text-[var(--color-gold)] font-mono text-sm">
        {children}
      </code>
    ),
    link: ({ children, value }: any) => {
      // Sanitize href to prevent XSS
      const sanitizedHref =
        value.href && typeof value.href === "string"
          ? value.href.replace(/[<>"']/g, "")
          : "#";

      // Block javascript: and data: URLs
      if (
        sanitizedHref.toLowerCase().startsWith("javascript:") ||
        sanitizedHref.toLowerCase().startsWith("data:")
      ) {
        return <span className="text-red-400">[Blocked unsafe link]</span>;
      }

      return (
        <a
          href={sanitizedHref}
          target={value.blank ? "_blank" : "_self"}
          rel={value.blank ? "noopener noreferrer" : undefined}
          className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 underline transition-colors duration-300"
        >
          {children}
        </a>
      );
    },
  },
};

export function BlogPost({ post }: BlogPostProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Cover Image */}
      {post.featuredImageUrl && (
        <div className="relative w-full h-[40vh] md:h-[50vh] lg:h-[60vh] xl:h-[70vh] overflow-hidden">
          <Image
            src={post.featuredImageUrl}
            alt={post.title}
            fill
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>
      )}

      {/* Article Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 lg:py-12">
          {/* Categories */}
          {post.categories && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 text-[var(--color-gold)]"
                >
                  {typeof category === "object" && "name" in category
                    ? category.name
                    : "Category"}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              {post.excerpt}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 pb-8 border-b border-white/10">
            {/* Author */}
            {post.author &&
              typeof post.author === "object" &&
              "name" in post.author && (
                <div className="flex items-center">
                  {post.author.avatarUrl && (
                    <Image
                      src={post.author.avatarUrl}
                      alt={post.author.name}
                      width={40}
                      height={40}
                      className="rounded-full mr-3"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {post.author.name}
                    </p>
                    {post.author.professionalTitle && (
                      <p className="text-sm text-gray-400">
                        {post.author.professionalTitle}
                      </p>
                    )}
                  </div>
                </div>
              )}

            {/* Date & Reading Time */}
            <div className="flex items-center gap-4 text-gray-400">
              {post.publishedAt && (
                <span>{formatDate(post.publishedAt)}</span>
              )}
              {post.readingTime && (
                <div className="flex items-center">
                  <ClockLucideIcon className="w-4 h-4 mr-1" />
                  <span>{post.readingTime} min read</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header for posts without featured image */}
        {!post.featuredImageUrl && (
          <div className="py-12 border-b border-white/10 mb-12">
            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.categories.map((category, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm font-medium border"
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

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-gray-300 leading-relaxed mb-8 max-w-3xl mx-auto">
                {post.excerpt}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-400">
              {/* Author */}
              {post.author &&
                typeof post.author === "object" &&
                "name" in post.author && (
                  <div className="flex items-center">
                    {post.author.avatarUrl && (
                      <Image
                        src={post.author.avatarUrl}
                        alt={post.author.name}
                        width={40}
                        height={40}
                        className="rounded-full mr-3"
                      />
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {post.author.name}
                      </p>
                      {post.author.professionalTitle && (
                        <p className="text-sm text-gray-400">
                          {post.author.professionalTitle}
                        </p>
                      )}
                    </div>
                  </div>
                )}

              {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}

              {post.readingTime && (
                <div className="flex items-center">
                  <ClockLucideIcon className="w-4 h-4 mr-2" />
                  <span>{post.readingTime} min read</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <article className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12">
          <div className="prose prose-lg max-w-none text-gray-300">
            <PortableText
              value={post.content}
              components={portableTextComponents}
            />
          </div>
        </article>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-(--color-gold)/20 text-(--color-gold) border border-(--color-gold)/30 rounded-full text-sm hover:bg-(--color-gold)/30 transition-colors duration-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        {post.author &&
          typeof post.author === "object" &&
          "bio" in post.author &&
          post.author.bio && (
            <div className="mt-8 p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl">
              <div className="flex items-start space-x-6">
                {post.author.avatarUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={post.author.avatarUrl}
                      alt={post.author.name}
                      width={80}
                      height={80}
                      className="rounded-full border-2 border-(--color-gold)/30"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    About {post.author.name}
                  </h3>
                  {post.author.professionalTitle && (
                    <p className="text-(--color-gold) font-medium mb-4">
                      {post.author.professionalTitle}
                    </p>
                  )}
                  <div className="text-gray-300">
                    <PortableText
                      value={post.author.bio}
                      components={portableTextComponents}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
