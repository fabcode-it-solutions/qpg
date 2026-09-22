"use client";
import Link from "next/link";
import { GoldButton } from "@/components/ui/GoldButton";
import { GlassCard } from "@/components/ui/GlassCard";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <GlassCard padding="lg" className="backdrop-blur-xl">
          {/* 404 Number */}
          <div className="mb-8">
            <h1 className="text-8xl sm:text-9xl font-bold text-transparent bg-gradient-to-br from-[var(--color-gold)] to-[var(--color-gold)]/60 bg-clip-text leading-none">
              404
            </h1>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Page Not Found
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved to a
              different location.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/">
              <GoldButton size="lg" className="w-full sm:w-auto">
                Go Home
              </GoldButton>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 text-white border border-white/20 rounded-lg hover:border-white/40 hover:bg-white/5 transition-all duration-300 w-full sm:w-auto"
            >
              Go Back
            </button>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-gray-400 text-sm mb-4">
              Or explore these pages:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/courses"
                className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 transition-colors"
              >
                Courses
              </Link>
              <Link
                href="/blog"
                className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/contact"
                className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/about"
                className="text-[var(--color-gold)] hover:text-[var(--color-gold)]/80 transition-colors"
              >
                About
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
