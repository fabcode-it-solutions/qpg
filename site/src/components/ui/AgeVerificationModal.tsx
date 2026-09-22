"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/utils";
import { AlertTriangle, Calendar } from "lucide-react";

interface AgeVerificationModalProps {
  isOpen: boolean;
  onVerify: () => void;
  onReject: () => void;
}

export default function AgeVerificationModal({ 
  isOpen, 
  onVerify, 
  onReject 
}: AgeVerificationModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-black/95 border border-white/20 rounded-2xl shadow-2xl">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-amber-500/20 rounded-full">
              <Calendar className="h-8 w-8 text-amber-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">
            Age Verification Required
          </h2>

          <div className="flex items-start gap-3 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-100 text-left">
              This website contains content related to cannabis
              You must be 21 years or older to access this site.
            </p>
          </div>

          <div className="mb-8">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/30 bg-transparent text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
              />
              <span className="text-sm text-white/90 text-left">
                I confirm that I am 21 years of age or older and legally allowed 
                to view cannabis-related content in my jurisdiction.
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={onVerify}
              disabled={!isChecked}
              className={cn(
                "w-full px-6 py-3 rounded-xl font-medium transition-all duration-200",
                isChecked
                  ? "bg-amber-500 text-black hover:bg-amber-400 focus:ring-2 focus:ring-amber-500/50"
                  : "bg-white/10 text-white/50 cursor-not-allowed"
              )}
            >
              Enter Site
            </button>

            <button
              onClick={onReject}
              className={cn(
                "w-full px-6 py-3 bg-transparent border border-white/30 text-white/70",
                "rounded-xl font-medium hover:bg-white/5 transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-white/50"
              )}
            >
              I am under 21
            </button>
          </div>

          <p className="text-xs text-white/50 mt-6">
            By entering this site, you acknowledge that you are of legal age 
            and agree to our terms of service.
          </p>
        </div>
      </div>
    </div>
  );
}