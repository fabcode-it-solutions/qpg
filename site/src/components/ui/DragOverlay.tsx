import React from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { DragOverlayProps } from "@/types";

/**
 * Professional drag overlay component with smooth animations
 * Provides clear visual feedback during drag operations
 *
 * @param props Component properties
 * @returns Drag overlay component
 */
export const DragOverlay: React.FC<DragOverlayProps> = ({
  isVisible,
  isDragOver,
  message = "Drop your cannabis plant image here",
  className,
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center
        bg-black/30 backdrop-blur-sm
        pointer-events-none transition-opacity duration-200
        ${isVisible ? "opacity-100" : "opacity-0"}
        ${className}`}
    >
      <div
        className={`relative max-w-md w-full mx-4 p-8 rounded-2xl bg-white/95 backdrop-blur shadow-2xl
          border-2 border-dashed border-blue-400 transition-transform duration-200
          ${isVisible ? "scale-100" : "scale-90"}`}
      >
        <div className="text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative p-4 rounded-full bg-blue-100 text-blue-600">
              <Upload size={32} />
              <ImageIcon
                size={16}
                className="absolute -top-1 -right-1 text-blue-500"
              />
            </div>
          </div>

          {/* Message */}
          <h3 className="text-lg font-semibold mb-2 text-blue-700">
            Drop Image Here
          </h3>

          <p className="text-sm text-blue-600 mb-4">{message}</p>

          {/* Supported formats */}
          <div className="flex justify-center gap-2 text-xs text-gray-500 mb-2">
            <span className="px-2 py-1 bg-white rounded-full border">JPEG</span>
            <span className="px-2 py-1 bg-white rounded-full border">PNG</span>
            <span className="px-2 py-1 bg-white rounded-full border">WebP</span>
          </div>

          {/* Size limit */}
          <p className="text-xs text-gray-400">Maximum size: 10MB</p>
        </div>
      </div>
    </div>
  );
};

export default DragOverlay;
