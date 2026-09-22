"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/utils";
import { GlassCard } from "./GlassCard";
import { ContactInfoProps, ContactMethod } from "@/types";
import { ProspectChatModal } from "../chat/ProspectChatModal";

export function ContactInfo({ methods, className }: ContactInfoProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleChatOpen = () => {
    setIsChatOpen(true);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  return (
    <>
      <div className={className}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {methods.map((method, index) => (
            <ContactMethodCard 
              key={index} 
              method={method} 
              onChatOpen={handleChatOpen}
            />
          ))}
        </div>
      </div>
      
      <ProspectChatModal 
        isOpen={isChatOpen} 
        onClose={handleChatClose} 
      />
    </>
  );
}

interface ContactMethodCardProps {
  method: ContactMethod;
  onChatOpen: () => void;
}

function ContactMethodCard({ method, onChatOpen }: ContactMethodCardProps) {
  const isLiveChat = method.title?.toLowerCase().includes('live chat') || 
                     method.href === '/plant-clinic';

  const handleClick = (e: React.MouseEvent) => {
    if (isLiveChat) {
      e.preventDefault();
      onChatOpen();
    }
  };
  const CardContent = () => (
    <GlassCard className="group hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] h-full">
      <div className="flex flex-col h-full">
        {/* Icon and Title */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-shrink-0">
            <div
              className={cn(
                "w-14 h-14 flex items-center justify-center rounded-2xl",
                "bg-gradient-to-br from-[var(--color-gold)]/20 to-[var(--color-gold)]/10",
                "border border-[var(--color-gold)]/20 group-hover:from-[var(--color-gold)]/30",
                "group-hover:to-[var(--color-gold)]/20 transition-all duration-300"
              )}
            >
              {method.icon}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white group-hover:text-[var(--color-gold)] transition-colors duration-300">
              {method.title}
            </h3>
          </div>
          {method.href && (
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-[var(--color-gold)] group-hover:translate-x-1 transition-all duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="flex-1 mb-4">
          <p className="text-sm text-gray-400 leading-relaxed min-h-[2.5rem]">
            {method.description}
          </p>
        </div>

        {/* Value */}
        <div className="mb-3">
          <p className="text-white font-medium break-words text-sm">
            {method.value}
          </p>
        </div>

        {/* Action */}
        {method.action && (
          <div className="mt-auto">
            <p className="text-xs text-[var(--color-gold)] group-hover:text-[var(--color-gold)]/80 transition-colors duration-300 font-medium">
              Click to {method.action}
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  );

  // Wrap with link if href is provided
  if (method.href) {
    return (
      <a
        href={isLiveChat ? "#" : method.href}
        onClick={handleClick}
        className="block focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/20 rounded-2xl h-full cursor-pointer"
        target={method.href.startsWith("http") && !isLiveChat ? "_blank" : undefined}
        rel={method.href.startsWith("http") && !isLiveChat ? "noopener noreferrer" : undefined}
      >
        <CardContent />
      </a>
    );
  }

  return <CardContent />;
}
