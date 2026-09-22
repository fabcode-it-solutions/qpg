/**
 * Configuration options for drag and drop functionality
 */
export interface DragDropConfig {
  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize?: number;
  /** Allowed MIME types (default: image types) */
  allowedTypes?: string[];
  /** Callback when files are dropped */
  onFilesDropped?: (files: File[]) => void;
  /** Callback when drag operation fails validation */
  onError?: (error: string) => void;
  /** Whether to allow multiple files (default: false) */
  multiple?: boolean;
}

/**
 * Return type for the drag and drop hook
 */
export interface DragDropReturn {
  /** Whether drag is currently active */
  isDragActive: boolean;
  /** Whether drag is over the drop zone */
  isDragOver: boolean;
  /** Error message if validation fails */
  error: string | null;
  /** Clear the current error */
  clearError: () => void;
  /** Props to spread on the drop zone element */
  getRootProps: () => {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

/**
 * Props for the DragOverlay component
 */
export interface DragOverlayProps {
  /** Whether the overlay should be visible */
  isVisible: boolean;
  /** Whether the drag is currently over the drop zone */
  isDragOver: boolean;
  /** Optional custom message */
  message?: string;
  /** Optional custom class name */
  className?: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  customerId?: string;
  timestamp: number;
}
