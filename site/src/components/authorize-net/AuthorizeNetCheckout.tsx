"use client";
import { useState } from "react";
import axios from "axios";

type SubscribeProps = {
  courseId: string;
  description?: string;
  buttonText?: string;
  className?: string;
};

const SubscribeComponent = ({
  courseId,
  description,
  buttonText = "Subscribe",
  className = "",
}: SubscribeProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create payment session
      const response = await axios.post("/api/authorize-net/checkout", {
        courseId,
      });

      // Redirect to payment page
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("Failed to create payment session");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to process payment"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {description && (
        <p className="text-white/80 text-center mb-4">{description}</p>
      )}

      <button
        onClick={handleSubscribe}
        disabled={isLoading}
        className="w-full bg-(--color-gold) text-black py-4 rounded-2xl font-semibold text-lg hover:bg-(--color-gold)/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
            Processing...
          </div>
        ) : (
          buttonText
        )}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}
    </div>
  );
};

export default SubscribeComponent;
