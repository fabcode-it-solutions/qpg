"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  JSX,
} from "react";
import { Send, Image, X, AlertTriangle } from "lucide-react";
import { isValidImageType, formatFileSize } from "@/lib/utils";
import { ChatInputProps } from "@/types";
import { cn } from "@/lib/utils/utils";

/**
 * Configuration constants for file upload validation
 */
const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  PREVIEW_MAX_HEIGHT: 80, // px
} as const;

/**
 * Professional chat input component with image upload capabilities
 * Includes comprehensive validation, error handling, and accessibility features
 *
 * @param props - Component properties
 * @returns Chat input component
 */
export function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  showImageUpload = true,
}: ChatInputProps): JSX.Element {
  // State management
  const [message, setMessage] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed values
  const canSubmit = useMemo(() => {
    return (
      (message.trim() || image) && !disabled && !imageError && !isProcessing
    );
  }, [message, image, disabled, imageError, isProcessing]);

  /**
   * Validates uploaded file against size and type constraints
   */
  const validateFile = useCallback((file: File): string | null => {
    if (
      !UPLOAD_CONFIG.ALLOWED_TYPES.includes(
        file.type as (typeof UPLOAD_CONFIG.ALLOWED_TYPES)[number]
      )
    ) {
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

  /**
   * Resets form state to initial values
   */
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

  /**
   * Handles form submission with validation
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

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

  /**
   * Processes a dropped image file
   */
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

  /**
   * Handles image file selection and validation
   */
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processImageFile(file);
      }
    },
    [processImageFile]
  );

  /**
   * Removes selected image and resets related state
   */
  const handleRemoveImage = useCallback(() => {
    setImage(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  /**
   * Triggers file input click
   */
  const handleImageButtonClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  /**
   * Handles dropped image from drag and drop
   */
  const handleDroppedImage = useCallback(
    (event: CustomEvent) => {
      const file = event.detail as File;
      if (file && !disabled) {
        processImageFile(file);
      }
    },
    [processImageFile, disabled]
  );

  // Listen for dropped images from drag and drop
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
    <div className="border-t bg-white/5 backdrop-blur-sm border-white/20">
      {imageError && (
        <div className="p-3 bg-red-500/10 border-b border-red-400/30">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle size={16} />
            <span className="text-sm">{imageError}</span>
          </div>
        </div>
      )}
      {imagePreview && (
        <div className="p-2 border-b">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Upload preview"
              className="h-20 w-auto rounded-md object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 p-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex-1 px-4 py-2",
            "bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60",
            "focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)]/50 focus:border-[var(--color-gold)]/50",
            "disabled:opacity-50",
            "2xl:text-[24px] lg:text-[20px] md:text-[18px] text-[16px]"
          )}
        />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={disabled}
        />
        {showImageUpload && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="px-3 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Image size={20} />
          </button>
        )}
        <button
          type="submit"
          disabled={(!message.trim() && !image) || disabled}
          className="px-4 py-2 bg-[var(--color-gold)] text-black rounded-lg hover:bg-[var(--color-gold)]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
