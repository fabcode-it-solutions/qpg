"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { BlogCategoriesProps } from "@/types";

interface ExtendedBlogCategoriesProps extends BlogCategoriesProps {
  scrollToSection?: boolean;
}

export function BlogCategories({
  categories,
  selectedCategory,
  scrollToSection = false,
}: ExtendedBlogCategoriesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createCategoryUrl = (categoryId?: string) => {
    const params = new URLSearchParams(searchParams);

    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }

    // Reset to first page when changing category
    params.delete("page");
    params.delete("search");

    return `/blog?${params.toString()}`;
  };

  const handleCategoryClick = (e: React.MouseEvent, categoryId?: string) => {
    e.preventDefault();
    const url = createCategoryUrl(categoryId);
    router.push(url);

    if (scrollToSection) {
      setTimeout(() => {
        const blogSection = document.getElementById("blog-section");
        if (blogSection) {
          blogSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  return (
    <GlassCard>
      <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>

      <div className="space-y-2">
        {/* All Categories Link */}
        <a
          href={createCategoryUrl()}
          onClick={(e) => handleCategoryClick(e)}
          className={`block px-3 py-2 rounded-lg text-sm transition-all duration-300 cursor-pointer ${
            !selectedCategory
              ? "bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/30"
              : "text-gray-300 hover:text-white hover:bg-white/5"
          }`}
        >
          All Categories
        </a>

        {/* Category Links */}
        {categories.map((category) => (
          <a
            key={category.id}
            href={createCategoryUrl(category.id)}
            onClick={(e) => handleCategoryClick(e, category.id)}
            className={`block px-3 py-2 rounded-lg text-sm transition-all duration-300 cursor-pointer ${
              selectedCategory === category.id
                ? "text-[var(--color-gold)] border border-[var(--color-gold)]/30"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
            style={{
              backgroundColor:
                selectedCategory === category.id
                  ? `${category.color || "var(--color-gold)"}20`
                  : undefined,
              borderColor:
                selectedCategory === category.id
                  ? `${category.color || "var(--color-gold)"}50`
                  : undefined,
              color:
                selectedCategory === category.id
                  ? category.color || "var(--color-gold)"
                  : undefined,
            }}
          >
            <div className="flex items-center justify-between">
              <span>{category.name}</span>
              {category.color && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
              )}
            </div>
          </a>
        ))}
      </div>
    </GlassCard>
  );
}
