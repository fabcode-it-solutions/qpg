import React, { useState, useCallback } from "react";
import { ChatMessageProps } from "@/types";
import {
  getBestImageUrl,
  getAttachmentDisplayName,
  formatFileSize,
  isValidImageMimeType,
} from "@/lib/utils/image";
import { MarkdownRenderer } from "@/lib/utils/markdown";
import { cn } from "@/lib/utils/utils";

/**
 * Individual image component with error handling and fallbacks
 */
const ImageAttachment: React.FC<{
  attachment: any;
  messageRole: "user" | "assistant";
}> = ({ attachment }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageUrl = getBestImageUrl(attachment);
  const displayName = getAttachmentDisplayName(attachment);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setImageError(false);
  }, []);

  const handleError = useCallback(
    (_e: React.SyntheticEvent<HTMLImageElement>) => {
      console.error("Image failed to load:", attachment);
      setIsLoading(false);
      setImageError(true);
    },
    [attachment]
  );

  if (!imageUrl || imageError) {
    return (
      <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-xl">
        <div className="animate-spin rounded-full h-6 w-6 border-4 border-(--color-gold)/20 border-t-(--color-gold)"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 rounded-xl">
          <div className="animate-spin rounded-full h-6 w-6 border-4 border-(--color-gold)/20 border-t-(--color-gold)"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={displayName}
        className={`w-full max-w-xs sm:max-w-sm md:max-w-md max-h-48 sm:max-h-56 md:max-h-64 rounded-xl object-cover border border-(--color-gold)/30 transition-opacity ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
      />
      <div className="mt-2 flex justify-between items-center">
        <div>
          <p
            className={cn(
              "text-xs md:text-[14px] lg:text-[18px] 2xl:text-[20px] text-white/70"
            )}
          >
            {displayName}
          </p>
          {attachment.size && (
            <p className="text-xs text-white/50">
              {formatFileSize(attachment.size)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Main ChatMessage component with production-ready image handling
 */
export function ChatMessage({ message, onFollowUpClick }: ChatMessageProps) {
  // Ensure backward compatibility and proper timestamp handling

  const isUser = message.sender === "user" || message.isUser === true;
  const timestamp =
    message.timestamp instanceof Date
      ? message.timestamp
      : new Date(message.timestamp);

  // Check if this is a diagnostic question message
  const isDiagnosticQuestions =
    message.metadata?.category === "diagnostic_questions" ||
    message.metadata?.category === "diagnostic_followup";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      <div
        className={`max-w-[80%] rounded-2xl px-6 py-4 ${
          isUser
            ? "bg-(--color-gold) text-black"
            : isDiagnosticQuestions
            ? "bg-(--color-gold)/10 text-white border-2 border-(--color-gold)/30"
            : "bg-white/10 text-white border border-white/20"
        }`}
      >
        {/* Diagnostic header if applicable */}
        {isDiagnosticQuestions && (
          <div className="mb-3 pb-2 border-b border-(--color-gold)/30">
            <p className="text-sm font-semibold text-(--color-gold) flex items-center gap-2">
              <span>🔍</span> Diagnostic Questions
            </p>
            {message.metadata?.workflowStep === 2 && (
              <p className="text-xs text-(--color-gold)/80 mt-1">
                Step 2 of 3: Interactive Diagnosis
              </p>
            )}
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <div className="whitespace-pre-wrap">
            {/* {isDiagnosticQuestions ? (
              <div className="space-y-3 text-xs md:text-[14px] lg:text-[18px] 2xl:text-[20px]">
                {React.useMemo(() => {
                  const sections = message.content.split("\n\n");
                  return sections.map((section, idx) => {
                    // Check if this is a numbered question
                    const questionMatch = section.match(/^(\d+)\.\s+(.+)$/m);
                    if (questionMatch) {
                      const [, number, questionText] = questionMatch;
                      const optionsMatch = section.match(/Options:\s*(.+)$/m);

                      return (
                        <div
                          key={idx}
                          className="bg-white/10 p-4 rounded-xl border border-(--color-gold)/20"
                        >
                          <p className="font-medium text-white mb-1">
                            <span className="text-(--color-gold) mr-2">
                              {number}.
                            </span>
                            {questionText}
                          </p>
                          {optionsMatch && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {optionsMatch[1]
                                .split(",")
                                .map((option, optIdx) => (
                                  <span
                                    key={optIdx}
                                    className="text-xs px-3 py-1 bg-(--color-gold)/20 text-(--color-gold) border border-(--color-gold)/30 rounded-lg"
                                  >
                                    {option.trim()}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      );
                    }
                    return <p key={idx}>{section}</p>;
                  });
                }, [message.content])}
              </div>
            ) : ( */}
            <MarkdownRenderer content={message.content} />
          </div>
        )}

        {/* Display attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className={`${message.content ? "mt-3" : ""} space-y-3`}>
            {message.attachments.map((attachment, index) => {
              // Handle error attachments
              if (attachment.error) {
                return (
                  <div
                    key={index}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-red-700">
                      <span>❌</span>
                      <div>
                        <p className="text-sm font-medium">Upload Error</p>
                        <p className="text-xs">{attachment.error}</p>
                        <p className="text-xs text-gray-500">
                          {getAttachmentDisplayName(attachment)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // Handle image attachments
              if (
                attachment.mimeType &&
                isValidImageMimeType(attachment.mimeType)
              ) {
                return (
                  <ImageAttachment
                    key={index}
                    attachment={attachment}
                    messageRole={isUser ? "user" : "assistant"}
                  />
                );
              }

              // Handle other file types
              return (
                <div
                  key={index}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 text-white">
                    <span>📎</span>
                    <div>
                      <p className="text-sm font-medium">
                        {getAttachmentDisplayName(attachment)}
                      </p>
                      {attachment.size && (
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.size)}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {attachment.mimeType || "Unknown file type"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Follow-up questions */}
        {message.followUpQuestions && message.followUpQuestions.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium text-(--color-gold)">
              Follow-up questions:
            </p>
            {message.followUpQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => onFollowUpClick?.(question)}
                className={cn(
                  "block w-full text-left text-sm bg-white/5 border border-white/20 rounded-xl px-4 py-3",
                  "hover:bg-white/10 hover:border-(--color-gold)/30 transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-gold)",
                  "text-white"
                )}
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p
          className={`text-xs mt-3 opacity-70 font-bold text-[12px] md:text-[14px] ${
            isUser ? "text-black/70" : "text-white/70"
          }`}
        >
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
      </div>
    </div>
  );
}
