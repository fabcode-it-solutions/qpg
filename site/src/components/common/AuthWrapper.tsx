"use client";
import Navbar from "@/layout/Navbar";
import React, { useCallback, useEffect, useMemo } from "react";
import ChatBot from "./ChatBot";
import { usePathname } from "next/navigation";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { useSession } from "next-auth/react";

const AuthWrapper = React.memo(
  ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname();
    const [show, setShow] = React.useState(false);
    const checkoutAccess = useCallback(async () => {
      const response = await fetch("/api/dashboard");

      const data = await response.json();
      if (response.ok) {
        if (data.courses.length > 0) {
          setShow(true);
        }
      }
    }, []);
    const { isVerified } = useAgeVerification();
    const { hasConsent } = useCookieConsent();

    // Memoize ChatBot visibility to prevent unnecessary re-renders
    const showChatBot = useMemo(() => {
      return (
        show &&
        isVerified &&
        hasConsent &&
        pathname !== "/chat" &&
        pathname !== "/plant-clinic" &&
        pathname !== "/auth/login" &&
        pathname !== "/auth/register"
      );
    }, [pathname, isVerified, hasConsent]);

    const hideNavbar = useMemo(() => {
      return (
        pathname === "/auth/login" ||
        pathname === "/auth/register" ||
        pathname === "/chat"
      );
    }, [pathname]);

    const isChatPage = pathname === "/chat";
    useEffect(() => {
      checkoutAccess();
    }, []);
    return (
      <div
        className={isChatPage ? "flex flex-col h-screen overflow-hidden" : ""}
      >
        {!hideNavbar && <Navbar />}
        <main className={isChatPage ? "flex-1 min-h-0" : ""}>{children}</main>
        {showChatBot && <ChatBot />}
      </div>
    );
  }
);

// Add display name for debugging
AuthWrapper.displayName = "AuthWrapper";

export default AuthWrapper;
