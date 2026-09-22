"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/utils";
import { XIcon, CloudUploadIcon, PlusIcon } from "@/components/icons";

interface ImageUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  className,
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    onChange(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer",
          "hover:border-[--color-gold] hover:bg-gray-50/50",
          isDragging && "border-[--color-gold] bg-[--color-gold]/5",
          error && "border-red-300 bg-red-50/50",
          disabled && "cursor-not-allowed opacity-50",
          !preview && "border-gray-300",
          preview && "border-[--color-gold] bg-[--color-gold]/5"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
          aria-describedby={error ? "image-upload-error" : undefined}
        />

        {preview ? (
          <div className="relative p-4">
            <div className="relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden">
              <Image
                src={preview}
                alt="Plant image preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-label="Remove image"
            >
              <XIcon className="w-4 h-4" />
            </button>

            <p className="text-center text-sm text-gray-600 mt-3">
              {value?.name || "Image uploaded successfully"}
            </p>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 text-gray-400 mb-4">
              <CloudUploadIcon className="w-full h-full" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload Plant Image
            </h3>

            <p className="text-gray-600 mb-4">
              Drag and drop your plant photo here, or click to browse
            </p>

            <div className="inline-flex items-center px-4 py-2 bg-[--color-gold] hover:bg-[--color-gold]/90 text-black font-medium rounded-full transition-colors duration-200">
              <PlusIcon className="w-4 h-4 mr-2" />
              Choose File
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Supports: JPG, PNG, GIF up to 10MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p
          id="image-upload-error"
          className="mt-2 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
