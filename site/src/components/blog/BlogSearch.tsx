"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { BlogSearchProps } from "@/types";

export function BlogSearch({ initialSearch = "" }: BlogSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams);

    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    } else {
      params.delete("search");
    }

    // Reset to first page when searching
    params.delete("page");
    params.delete("category");

    router.push(`/blog?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchTerm("");
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    params.delete("page");
    router.push(`/blog?${params.toString()}`);
  };

  return (
    <GlassCard>
      <h3 className="text-lg font-semibold text-white mb-4">Search Articles</h3>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for articles..."
            className="w-full px-4 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[var(--color-gold)] transition-colors duration-300"
          />

          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-300"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <button
          type="submit"
          className="w-full px-4 py-3 bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-gold)]/80 text-black font-semibold rounded-lg hover:from-[var(--color-gold)]/90 hover:to-[var(--color-gold)]/70 transition-all duration-300"
        >
          Search
        </button>
      </form>
    </GlassCard>
  );
}
