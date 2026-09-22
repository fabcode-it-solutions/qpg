"use client";

import React from "react";
import Image from "next/image";
import { Wifi, WifiOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/utils";

export interface ChatNavbarProps {
  /** Whether to show the clear history button */
  showClearHistory?: boolean;
  /** Whether to show the connection status */
  showConnectionStatus?: boolean;
  /** Whether user is connected */
  isConnected?: boolean;
  /** Whether user is authenticated */
  isAuthenticated?: boolean;
  /** Whether there are messages (to show clear button) */
  hasMessages?: boolean;
  /** Clear history callback */
  onClearHistory?: () => void;
  /** Custom logo path (optional) */
  logoPath?: string;
  /** Custom logo alt text */
  logoAlt?: string;
}

export default function ChatNavbar({
  showClearHistory = false,
  showConnectionStatus = false,
  isConnected = false,
  isAuthenticated = false,
  hasMessages = false,
  onClearHistory,
  logoPath = "/images/qpg-logo-gold.png",
  logoAlt = "QPG Logo",
}: ChatNavbarProps) {
  // Check if any buttons are being shown
  const hasButtons = (showClearHistory && hasMessages) || showConnectionStatus;

  return (
    <div className="border-b border-white/10 p-2 bg-black">
      {hasButtons ? (
        // Layout when buttons are present
        <div className="flex items-center justify-between">
          {/* Logo - Left on mobile, center on desktop */}
          <div className="md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
            <Link href="/">
              <div className="h-[40px] w-[40px] md:h-[50px] md:w-[50px] xl:h-[70px] xl:w-[70px] 2xl:h-[180px] 2xl:w-[166px]">
                <Image
                  height={90}
                  width={90}
                  alt={logoAlt}
                  src={logoPath}
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Spacer for desktop to push buttons to the right */}
          <div className="hidden md:block flex-1"></div>

          {/* Buttons - Right side */}
          <div className="flex items-center gap-2 md:gap-4">
            {showClearHistory && hasMessages && (
              <button
                onClick={onClearHistory}
                disabled={!isAuthenticated}
                className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 text-xs md:text-sm text-red-400 hover:bg-red-500/10 border border-red-400/30 rounded-xl transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} className="md:w-4 md:h-4" />
                <span className="hidden sm:inline">Clear History</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}

            {showConnectionStatus && (
              <>
                {isConnected && isAuthenticated ? (
                  <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 bg-green-500/10 border border-green-400/30 rounded-xl">
                    <Wifi size={14} className="text-green-400 md:w-4 md:h-4" />
                    <span className="text-xs md:text-sm text-green-400 hidden sm:inline">
                      Connected
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-2 bg-red-500/10 border border-red-400/30 rounded-xl">
                    <WifiOff size={14} className="text-red-400 md:w-4 md:h-4" />
                    <span className="text-xs md:text-sm text-red-400 hidden sm:inline">
                      {isConnected ? "Auth..." : "Disconnected"}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        // Layout when no buttons - logo always centered
        <div className="flex items-center justify-center">
          <Link href="/">
            <div
              className={cn(
                "h-[70px] w-[66px] md:h-[100px] md:w-[86px]",
                "lg:h-[120px] lg:w-[106px] xl:h-[150px] xl:w-[136px] 2xl:h-[180px] 2xl:w-[166px]"
              )}
            >
              <Image
                height={90}
                width={90}
                alt={logoAlt}
                src={logoPath}
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
