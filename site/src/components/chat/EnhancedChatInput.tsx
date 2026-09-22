"use client";
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Send, Image, X, AlertTriangle } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import { cn } from "@/lib/utils/utils";

export interface PlantInfo {
  stage: "seedling" | "veg" | "flower";
  week: number;
}

export interface EnhancedChatInputProps {
  onSendMessage: (message: string, image?: File) => void;
  disabled?: boolean;
  placeholder?: string;
  isDiagnosticMode?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
} as const;

export function EnhancedChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Describe your plant issue or ask a question...",
  isDiagnosticMode = false,
  suggestions = [],
  onSuggestionClick,
}: EnhancedChatInputProps) {
  const [message, setMessage] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = useMemo(() => {
    return (
      (message.trim() || image) && !disabled && !imageError && !isProcessing
    );
  }, [message, image, disabled, imageError, isProcessing]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const validateFile = useCallback((file: File): string | null => {
    if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
      const allowedFormats = UPLOAD_CONFIG.ALLOWED_TYPES.map((type) =>
        type.split("/")[1].toUpperCase()
      ).join(", ");
      return `Invalid file type. Please upload: ${allowedFormats}`;
    }

    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE) {
      const maxSizeMB = UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
      return `File size exceeds ${maxSizeMB}MB limit. Current: ${formatFileSize(
        file.size
      )}`;
    }

    return null;
  }, []);

  const resetForm = useCallback(() => {
    setMessage("");
    setImage(null);
    setImagePreview(null);
    setImageError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!canSubmit) return;

      setIsProcessing(true);

      try {
        onSendMessage(message.trim(), image || undefined);
        resetForm();
      } catch (error) {
        console.error("Error sending message:", error);
        setImageError("Failed to send message. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    },
    [canSubmit, message, image, onSendMessage, resetForm]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const processImageFile = useCallback(
    (file: File) => {
      setImageError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setImageError(validationError);
        return;
      }

      setIsProcessing(true);
      setImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsProcessing(false);
      };
      reader.onerror = () => {
        setImageError("Failed to process image file. Please try again.");
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    },
    [validateFile]
  );

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processImageFile(file);
      }
    },
    [processImageFile]
  );

  const handleRemoveImage = useCallback(() => {
    setImage(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleDroppedImage = useCallback(
    (event: CustomEvent) => {
      const file = event.detail as File;
      if (file && !disabled) {
        processImageFile(file);
      }
    },
    [processImageFile, disabled]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (onSuggestionClick) {
        onSuggestionClick(suggestion);
      } else {
        setMessage(suggestion);
      }
    },
    [onSuggestionClick]
  );

  // Listen for dropped images
  useEffect(() => {
    const handleImageDropped = (event: Event) => {
      handleDroppedImage(event as CustomEvent);
    };

    document.addEventListener("imageDropped", handleImageDropped);
    return () => {
      document.removeEventListener("imageDropped", handleImageDropped);
    };
  }, [handleDroppedImage]);

  return (
    <div className="border-t border-white/20 bg-white/5 backdrop-blur-sm p-4 md:p-6">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/10 bg-(--color-gold)/10 rounded-t-xl mb-4">
          <p className="text-xs md:text-sm font-medium text-(--color-gold) mb-2 md:mb-3">
            💡 Quick answers:
          </p>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "text-xs px-3 md:px-4 py-1.5 md:py-2 bg-(--color-gold)/20 hover:bg-(--color-gold)/30 text-(--color-gold)",
                  "border border-(--color-gold)/30 rounded-lg md:rounded-xl transition-colors"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Error */}
      {imageError && (
        <div className="p-4 bg-red-500/10 border-b border-red-400/30 mx-6 my-2 rounded-xl">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={16} />
            <span className="text-sm">{imageError}</span>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {imagePreview && (
        <div className="p-6 border-b border-white/10">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Upload preview"
              className="h-24 w-auto rounded-xl object-cover border border-(--color-gold)/50"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white/10 border border-white/20 rounded-xl md:rounded-2xl">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 md:gap-4 p-3 md:p-4">
          <div className="flex-1 flex">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isDiagnosticMode
                  ? "Answer the questions above (e.g., '1. Yes, 2. 3 days ago')"
                  : placeholder
              }
              disabled={disabled}
              className={cn(
                "w-full px-3 md:px-4 py-3 md:py-3.5 bg-transparent",
                "border border-white/30 rounded-lg md:rounded-xl text-white placeholder-white/60",
                "focus:outline-none focus:ring-2 focus:ring-(--color-gold) focus:border-(--color-gold) disabled:opacity-50 transition-all",
                "text-sm md:text-base lg:text-lg xl:text-xl",
                "resize-none overflow-hidden min-h-[44px] md:min-h-[48px]"
              )}
              rows={1}
            />
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={disabled}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-lg md:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Upload plant image"
            >
              <Image size={18} className="md:w-5 md:h-5" />
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center justify-center px-4 md:px-6 h-11 md:h-12 bg-(--color-gold) hover:bg-(--color-gold)/90 text-black font-medium rounded-lg md:rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
              title="Send message"
            >
              <Send size={18} className="md:w-5 md:h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}