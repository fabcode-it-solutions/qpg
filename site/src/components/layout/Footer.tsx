"use client";
import Link from "next/link";
import CreditCardLogos from "@/components/ui/CreditCardLogos";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function Footer() {
  const pathname = usePathname();

  const hideFooter = useMemo(() => {
    return (
      pathname === "/auth/login" ||
      pathname === "/auth/register" ||
      pathname === "/chat"
    );
  }, [pathname]);

  return (
    <>
      {!hideFooter ? (
        <footer className="bg-black border-t border-white/10 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Company Info */}
              <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                <h3 className="text-base sm:text-lg font-semibold text-(--color-gold)">
                  Quantum Pot Grow
                </h3>
                <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                  Professional online courses and training platform for skill
                  development and career advancement.
                </p>
              </div>

              {/* Quick Links */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Quick Links
                </h3>
                <ul className="space-y-2 text-sm sm:text-base">
                  <li>
                    <Link
                      href="/courses"
                      className="text-white/70 hover:text-(--color-gold) transition-colors block py-1"
                    >
                      All Courses
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-white/70 hover:text-(--color-gold) transition-colors block py-1"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/profile"
                      className="text-white/70 hover:text-(--color-gold) transition-colors block py-1"
                    >
                      My Profile
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Legal
                </h3>
                <ul className="space-y-2 text-sm sm:text-base">
                  <li>
                    <Link
                      href="/terms"
                      className="text-white/70 hover:text-(--color-gold) transition-colors block py-1 leading-relaxed"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy"
                      className="text-white/70 hover:text-(--color-gold) transition-colors block py-1 leading-relaxed"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/refund"
                      className="text-white/70 hover:text-(--color-gold) transition-colors block py-1 leading-relaxed"
                    >
                      Refund Policy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/fulfillment"
                      className="text-white/70 hover:text-(--color-gold) transition-colors block py-1 leading-relaxed"
                    >
                      Fulfillment & Delivery Policy
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact & Support */}
              <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
                <h3 className="text-base sm:text-lg font-semibold text-white">
                  Contact & Support
                </h3>
                <div className="space-y-3 text-sm sm:text-base text-white/70">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href="mailto:support@quantumpotgrow.com"
                      className="hover:text-(--color-gold) transition-colors break-all sm:break-normal"
                    >
                      support@quantumpotgrow.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <a
                      href="tel:+16145229418"
                      className="hover:text-(--color-gold) transition-colors"
                    >
                      (614) 522-9418
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <div className="leading-relaxed">
                      <p>3296 Westerville Road, Columbus</p>
                      <p>OH, United States, Ohio</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 mt-6 sm:mt-8 pt-6 sm:pt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                <div className="text-xs sm:text-sm text-white/60 text-center sm:text-left">
                  <p>
                    &copy; {new Date().getFullYear()} Quantum Pot Grow, LLC. All
                    rights reserved.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <CreditCardLogos />
                </div>
              </div>
            </div>
          </div>
        </footer>
      ) : (
        <></>
      )}
    </>
  );
}
