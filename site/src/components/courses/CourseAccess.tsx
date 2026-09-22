"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import SubscribeComponent from "@/components/authorize-net/AuthorizeNetCheckout";
import { CourseAccessProps } from "@/types/course";
import { LockKeyhole } from "lucide-react";
import { WarningIcon, CheckCircleIcon, SpinnerIcon } from "@/components/icons";

export default function CourseAccess({
  courseId,
  course,
  children,
}: CourseAccessProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (status === "loading") return;

      if (!session) {
        router.push(`/auth/login?callbackUrl=/courses/${courseId}`);
        return;
      }

      try {
        const response = await fetch(`/api/courses/${courseId}/access`, {
          cache: "no-store", // Always get fresh data
        });

        if (!response.ok) {
          if (response.status === 403) {
            setHasAccess(false);
          } else {
            throw new Error("Failed to check course access");
          }
        } else {
          const data = await response.json();
          console.log("Course access check result:", {
            courseId,
            hasAccess: data.hasAccess,
          });
          setHasAccess(data.hasAccess);
        }
      } catch (err) {
        console.error("Error checking course access:", err);
        setError("Failed to verify course access. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();

    // Check for success parameter and refresh access
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      console.log("Success parameter detected, refreshing access check");
      // Delay to allow webhook processing
      setTimeout(() => {
        console.log("Rechecking access after payment success");
        checkAccess();
      }, 3000); // Increased delay to ensure webhook processing
    }
  }, [courseId, session, status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8 sm:py-12 lg:py-16">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
          <SpinnerIcon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-(--color-gold) mx-auto mb-3 sm:mb-4" />
          <p className="text-base sm:text-lg font-medium text-white">
            Checking your access...
          </p>
          <p className="text-xs sm:text-sm text-white/60 mt-1 sm:mt-2">
            This will just take a moment
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8 sm:py-12 lg:py-16">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-red-500/30">
            <WarningIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
            Oops! Something went wrong
          </h3>
          <p className="text-white/70 mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-(--color-gold) text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold hover:bg-(--color-gold)/80 transition-colors text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6 sm:py-8 lg:py-12">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-black via-gray-900 to-black px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 text-white text-center border-b border-white/10">
            <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <LockKeyhole className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-(--color-gold)" />
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">
              Unlock Full Course Access
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              Get instant access to all course materials, one year updates, and
              our community.
            </p>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6">
                  What's included:
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    </div>
                    <span className="text-white/80 font-medium text-sm sm:text-base">
                      HD video streaming
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    </div>
                    <span className="text-white/80 font-medium text-sm sm:text-base">
                      Progress tracking
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                    </div>
                    <span className="text-white/80 font-medium text-sm sm:text-base">
                      30-day money-back guarantee
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <SubscribeComponent
                  courseId={courseId}
                  description={`Get full access to "${course.title}"`}
                  buttonText={`Get Instant Access - $${course.price}`}
                  className=""
                />
                <p className="text-xs sm:text-sm text-white/60 text-center mt-3 sm:mt-4">
                  <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 text-green-400" />
                  Secure payment with SSL encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
