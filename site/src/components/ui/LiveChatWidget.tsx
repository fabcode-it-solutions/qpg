"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { ProspectChatModal } from "../chat/ProspectChatModal";
import { cn } from "@/lib/utils/utils";

interface LiveChatWidgetProps {
  className?: string;
  title?: string; // Title for the chat modal window (optional)
}

export function LiveChatWidget({
  className = "",
  title = "Questions? Ask Q",
}: LiveChatWidgetProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleCloseChat = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpenChat}
        className={cn(
          "text-lg 2xl:text-[40px] uppercase px-8 py-3 2xl:px-18 2xl:py-5 leading-[normal]",
          "inline-flex items-center gap-2 bg-[var(--color-gold)]/20 hover:bg-[var(--color-gold)]/30",
          "border border-[var(--color-gold)] text-[var(--color-gold)] hover:text-white",
          "transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/20",
          `${className}`
        )}
      >
        {title}
      </button>

      <ProspectChatModal isOpen={isChatOpen} onClose={handleCloseChat} />
    </>
  );
}
