import { DragDropConfig, DragDropReturn } from "@/types/common";
import { useCallback, useRef, useState } from "react";

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<
  Omit<DragDropConfig, "onFilesDropped" | "onError">
> = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  multiple: false,
};

/**
 * Professional drag and drop hook with comprehensive validation
 * Supports file type validation, size limits, and error handling
 *
 * @param config Configuration options for drag and drop behavior
 * @returns Drag and drop state and handlers
 */
export function useDragAndDrop(config: DragDropConfig = {}): DragDropReturn {
  const {
    maxFileSize = DEFAULT_CONFIG.maxFileSize,
    allowedTypes = DEFAULT_CONFIG.allowedTypes,
    multiple = DEFAULT_CONFIG.multiple,
    onFilesDropped,
    onError,
  } = config;

  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use timeout to stabilize drag events
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragActiveRef = useRef(false);

  /**
   * Validates a file against size and type constraints
   */
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!allowedTypes.includes(file.type)) {
        return `Invalid file type. Please upload: ${allowedTypes
          .join(", ")
          .replace(/image\//g, "")
          .toUpperCase()}`;
      }

      if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
        return `File size exceeds ${maxSizeMB}MB limit. Current size: ${Math.round(
          file.size / (1024 * 1024)
        )}MB`;
      }

      return null;
    },
    [allowedTypes, maxFileSize]
  );

  /**
   * Validates an array of files
   */
  const validateFiles = useCallback(
    (files: File[]): { validFiles: File[]; errors: string[] } => {
      if (!multiple && files.length > 1) {
        return {
          validFiles: [],
          errors: ["Multiple files not supported. Please drop only one file."],
        };
      }

      const validFiles: File[] = [];
      const errors: string[] = [];

      files.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      });

      return { validFiles, errors };
    },
    [multiple, validateFile]
  );

  /**
   * Clears the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clears existing timeout and sets new one
   */
  const setDragTimeout = useCallback(
    (callback: () => void, delay: number = 100) => {
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }
      dragTimeoutRef.current = setTimeout(callback, delay);
    },
    []
  );

  /**
   * Handles drag enter events
   */
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Only process if it's a file drag
      if (e.dataTransfer?.types?.includes("Files")) {
        dragActiveRef.current = true;
        setIsDragActive(true);
        clearError();
      }
    },
    [clearError]
  );

  /**
   * Handles drag leave events
   */
  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Use timeout to prevent flickering when dragging over child elements
      setDragTimeout(() => {
        if (!dragActiveRef.current) {
          setIsDragActive(false);
          setIsDragOver(false);
        }
      }, 50);
    },
    [setDragTimeout]
  );

  /**
   * Handles drag over events
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }

      if (!isDragOver) {
        setIsDragOver(true);
      }
    },
    [isDragOver]
  );

  /**
   * Handles drop events with comprehensive validation
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Clear timeout and reset state
      if (dragTimeoutRef.current) {
        clearTimeout(dragTimeoutRef.current);
      }

      dragActiveRef.current = false;
      setIsDragActive(false);
      setIsDragOver(false);

      const { files } = e.dataTransfer;
      if (!files || files.length === 0) {
        const errorMsg = "No files detected. Please try again.";
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      const fileArray = Array.from(files);
      const { validFiles, errors } = validateFiles(fileArray);

      if (errors.length > 0) {
        const errorMsg = errors.join("\n");
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      if (validFiles.length > 0) {
        onFilesDropped?.(validFiles);
        clearError();
      }
    },
    [validateFiles, onFilesDropped, onError, clearError]
  );

  /**
   * Returns props to spread on the drop zone element
   */
  const getRootProps = useCallback(
    () => ({
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    }),
    [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]
  );

  return {
    isDragActive,
    isDragOver,
    error,
    clearError,
    getRootProps,
  };
}
