"use client";

import { useState, useEffect } from "react";

const AGE_VERIFICATION_KEY = "qpg-age-verified";

export function useAgeVerification() {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const verified = localStorage.getItem(AGE_VERIFICATION_KEY);
    setIsVerified(!!verified);
  }, []);

  const verifyAge = () => {
    localStorage.setItem(AGE_VERIFICATION_KEY, "true");
    setIsVerified(true);
  };

  const clearVerification = () => {
    localStorage.removeItem(AGE_VERIFICATION_KEY);
    setIsVerified(false);
  };

  return {
    isVerified,
    verifyAge,
    clearVerification,
  };
}

export default useAgeVerification;