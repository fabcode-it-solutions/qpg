"use client";

import { cn } from "@/lib/utils/utils";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

const ChatBot = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  // Show the chatbot after a delay to prevent hydration issues
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000); // 1 second delay

    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = () => {
    router.push("/plant-clinic");
  };

  // Don't render on server to prevent hydration issues
  if (!isVisible) {
    return null;
  }

  return (
    <div className="group flex items-center fixed bottom-6 right-6 z-[9999] drop-shadow-2xl">
      {/* Hover Text */}
      <div
        className={`
          bg-white text-[#000000] text-[14px] font-medium px-4 py-3 rounded-lg shadow-lg
          transition-all duration-300 ease-in-out
          mr-3 whitespace-nowrap
          ${
            isHovered
              ? "opacity-100 translate-x-0 pointer-events-auto"
              : "opacity-0 translate-x-2 pointer-events-none"
          }
        `}
      >
        Your Pot Grow Clinic, Ask
        {/* Arrow pointing to the button */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
          <div className="w-0 h-0 border-l-8 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </div>
      </div>

      {/* Chat Button */}
      <div
        onClick={handleNavigate}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="
          relative cursor-pointer p-3 rounded-full 
          bg-(--color-gold) hover:bg-(--color-gold)/90
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-in-out
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-4 focus:ring-(--color-gold)/30
        "
        aria-label="Open Chat Assistant"
      >
        <Image
          src={"/images/Q-logo.png"}
          alt="chat-bot logo"
          height={40}
          width={40}
          className="w-10 h-10 object-contain"
        />

        {/* Pulse Animation Ring */}
        <div className="absolute inset-0 rounded-full bg-(--color-gold) opacity-20 animate-ping group-hover:animate-none" />

        {/* Hover Animation Ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-(--color-gold)",
            "opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300"
          )}
        />
      </div>
    </div>
  );
};

export default ChatBot;
