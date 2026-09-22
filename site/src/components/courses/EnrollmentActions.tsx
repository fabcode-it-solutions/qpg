import { useState } from "react";
import { useSession } from "next-auth/react";
import { Play } from "lucide-react";
import CreditCardLogos from "@/components/ui/CreditCardLogos";

interface EnrollmentActionsProps {
  courseId: string;
  price: string;
  hasAccess: boolean;
}

export function EnrollmentActions({
  courseId,
  price,
  hasAccess,
}: EnrollmentActionsProps) {
  const { data: session } = useSession();
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }

    setPurchasing(true);
    try {
      const response = await fetch("/api/authorize-net/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to start purchase process. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  if (hasAccess) {
    return (
      <button
        onClick={() => {
          const contentSection = document.getElementById("course-content");
          contentSection?.scrollIntoView({ behavior: "smooth" });
        }}
        className="w-full bg-(--color-gold) text-black py-3 rounded-2xl font-semibold hover:bg-(--color-gold)/80 transition-colors inline-flex items-center justify-center gap-2"
      >
        <Play size={18} />
        Continue Learning
      </button>
    );
  }

  return (
    <>
      <div className="text-3xl font-bold text-(--color-gold) mb-2">
        {formatPrice(price)}
      </div>
      <p className="text-white/60 text-sm mb-6">Yearly subscription</p>

      <button
        onClick={handlePurchase}
        disabled={purchasing}
        className="w-full bg-(--color-gold) text-black py-4 rounded-2xl font-semibold text-lg hover:bg-(--color-gold)/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 mb-6"
      >
        {purchasing ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
            Processing...
          </div>
        ) : (
          `Enroll Now - ${formatPrice(price)}`
        )}
      </button>

      <div className="space-y-3 text-sm text-white/80">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>100% Money Back Guarantee</span>
        </div>
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>HD video streaming</span>
        </div>
        {/* <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Progress tracking</span>
        </div> */}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <CreditCardLogos className="justify-center" />
      </div>
    </>
  );
}
