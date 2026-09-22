"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Category } from "@/types/course";

interface CategoryDropdownProps {
  categories: Category[];
  currentCategory?: string;
}

export function CategoryDropdown({ categories, currentCategory }: CategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find(cat => cat.slug === currentCategory);
  const displayText = selectedCategory ? selectedCategory.name : "All Courses";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
      >
        <span className="font-medium">{displayText}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl z-[9999] max-h-60 overflow-y-auto">
          <a
            href="/courses"
            onClick={() => setIsOpen(false)}
            className={`block px-4 py-3 text-sm font-medium transition-colors hover:bg-white/20 ${
              !currentCategory ? "bg-(--color-gold) text-black" : "text-white"
            }`}
          >
            All Courses
          </a>
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`/courses?category=${encodeURIComponent(cat.slug)}`}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-3 text-sm font-medium transition-colors hover:bg-white/20 ${
                currentCategory === cat.slug ? "bg-(--color-gold) text-black" : "text-white"
              }`}
            >
              {cat.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}