/**
 * Bunny.net Stream API Types
 */

export interface BunnyVideoResponse {
  guid: string;
  videoLibraryId: number;
  title: string;
  dateUploaded: string;
  views: number;
  isPublic: boolean;
  length: number;
  status: number;
  framerate: number;
  width: number;
  height: number;
  availableResolutions: string;
  thumbnailCount: number;
  encodeProgress: number;
  storageSize: number;
  captions: any[];
  hasMP4Fallback: boolean;
  collectionId: string;
  thumbnailFileName: string;
  averageWatchTime: number;
  totalWatchTime: number;
  category: string;
  chapters: any[];
  moments: any[];
  metaTags: any[];
  transcodingMessages: any[];
}

export interface BunnyUploadResponse {
  success: boolean;
  id: number;
  directPlayUrl: string;
}

export interface BunnyTokenAuthParams {
  videoId: string;
  expirationTime: number;
  userId?: string;
  ip?: string;
}

export interface BunnyVideoStatus {
  QUEUED: 0;
  PROCESSING: 1;
  ENCODING: 2;
  FINISHED: 3;
  READY: 4;
  ERROR: 5;
}

export interface SecureVideoStreamData {
  id: string;
  title: string;
  description: string;
  streamUrl: string;
  iframeUrl: string;
  thumbnailUrl: string;
  duration: number;
  width: number;
  height: number;
  expiresAt: string;
}

export interface BunnyVideoMetadata {
  guid: string;
  title: string;
  length: number;
  width: number;
  height: number;
  framerate: number;
  storageSize: number;
  thumbnailFileName: string;
  status: number;
  encodeProgress: number;
}

export interface TokenAuthenticationParams {
  videoId: string;
  expirationTime: number;
  userId?: string;
  ip?: string;
}
