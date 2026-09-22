"use client";

import { useEffect, useRef } from "react";
import { X, MessageCircle } from "lucide-react";
import { useProspectChatStore } from "@/stores/prospect-chat.store";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";

interface ProspectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProspectChatModal({ isOpen, onClose }: ProspectChatModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isConnected,
    isAuthenticated,
    isTyping,
    error,
    connect,
    disconnect,
    sendMessage,
    clearChat,
  } = useProspectChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && !isAuthenticated) {
      connect();
    }
  }, [isOpen, isAuthenticated, connect]);

  // Cleanup on component unmount only
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const handleFollowUpClick = (question: string) => {
    sendMessage(question);
  };

  const handleClose = () => {
    // Don't disconnect, just close modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-7xl h-[600px] bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[var(--color-gold)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Chat with Q</h3>
              <p className="text-sm text-white/60">
                {isAuthenticated
                  ? "Online"
                  : isConnected
                  ? "Authenticating..."
                  : "Connecting..."}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && isAuthenticated && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[var(--color-gold)]/20 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-[var(--color-gold)]" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">
                Welcome! I'm Q.
              </h4>
              <p className="text-sm text-white/60 max-w-xs mx-auto">
                I'm here to help you with cannabis cultivation questions and
                guide you to the right resources.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onFollowUpClick={handleFollowUpClick}
            />
          ))}

          {isTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput
          onSendMessage={sendMessage}
          disabled={!isAuthenticated}
          showImageUpload={false}
          placeholder={
            isAuthenticated
              ? "Ask Q about cannabis cultivation..."
              : "Connecting..."
          }
        />

        {/* Error display */}
        {error && (
          <div className="p-2 border-t border-red-500/20 bg-red-500/10">
            <p className="text-xs text-red-400 text-center">{error}</p>
          </div>
        )}

        {/* Clear chat button */}
        {messages.length > 0 && (
          <div className="p-2 border-t border-white/10">
            <button
              onClick={clearChat}
              className="w-full text-xs text-white/50 hover:text-white/70 py-2 transition-colors"
            >
              Clear conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
