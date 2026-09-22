"use client";

import React from "react";
import { cn } from "@/lib/utils/utils";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function AgeRestrictedPage() {
  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-black/50 border border-red-500/30 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-500/20 rounded-full">
              <AlertTriangle className="h-12 w-12 text-red-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            Access Restricted
          </h1>

          <p className="text-white/70 mb-6 leading-relaxed">
            This website contains content related to cannabis and is restricted to individuals 
            who are 21 years of age or older.
          </p>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-8">
            <p className="text-sm text-red-200">
              <strong>Legal Notice:</strong> You must be of legal age in your jurisdiction to access this content. 
              Cannabis laws vary by location.
            </p>
          </div>

          <button
            onClick={handleGoBack}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-6 py-3",
              "bg-white/10 border border-white/30 text-white rounded-xl",
              "hover:bg-white/20 transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-white/50"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          <p className="text-xs text-white/50 mt-6">
            If you believe you've reached this page in error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}