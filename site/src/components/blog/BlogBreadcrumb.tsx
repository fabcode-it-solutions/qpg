"use client";

import Link from "next/link";
import { ChevronDownIcon } from "@/components/icons";
import { BlogBreadcrumbProps } from "@/types";

export function BlogBreadcrumb({ postTitle, categories }: BlogBreadcrumbProps) {
  const primaryCategory =
    categories && categories.length > 0 ? categories[0] : null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-8">
      <Link
        href="/"
        className="hover:text-[var(--color-gold)] transition-colors duration-300"
      >
        Home
      </Link>

      <ChevronDownIcon className="w-4 h-4 -rotate-90" />

      <Link
        href="/blog"
        className="hover:text-[var(--color-gold)] transition-colors duration-300"
      >
        Blog
      </Link>

      {primaryCategory &&
        typeof primaryCategory === "object" &&
        "name" in primaryCategory && (
          <>
            <ChevronDownIcon className="w-4 h-4 -rotate-90" />
            <span className="text-[var(--color-gold)]">
              {primaryCategory.name}
            </span>
          </>
        )}

      <ChevronDownIcon className="w-4 h-4 -rotate-90" />

      <span className="text-white font-medium truncate max-w-xs">
        {postTitle}
      </span>
    </nav>
  );
}
