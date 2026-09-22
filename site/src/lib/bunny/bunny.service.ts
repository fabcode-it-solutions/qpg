import { BunnyVideoResponse, TokenAuthenticationParams } from "@/types";
import crypto from "crypto";

export class BunnyService {
  private apiKey: string;
  private libraryId: string;
  private hostname: string;
  private cdnHostname: string;
  private storageZoneName: string;
  private storageApiKey: string;
  private collectionId: string;
  private tokenAuthKey: string;

  constructor() {
    this.apiKey = process.env.BUNNY_API_KEY || "";
    this.libraryId = process.env.BUNNY_STREAM_LIBRARY_ID || "";
    this.hostname = process.env.BUNNY_STREAM_HOSTNAME || "video.bunnycdn.com";
    this.cdnHostname = process.env.BUNNY_CDN_HOSTNAME || "";
    this.storageZoneName = process.env.BUNNY_STORAGE_ZONE_NAME || "";
    this.storageApiKey = process.env.BUNNY_STORAGE_API_KEY || "";
    this.collectionId = process.env.BUNNY_STREAM_COLLECTION_ID || "";
    this.tokenAuthKey = process.env.BUNNY_TOKEN_AUTH_KEY || "";

    if (!this.apiKey || !this.libraryId) {
      console.warn(
        "Bunny.net API credentials not found in environment variables"
      );
      // Don't throw error immediately - allow service to be created but methods will handle missing credentials
    }
  }

  /**
   * Upload a video to Bunny Stream
   */
  async uploadVideo(
    title: string,
    collectionId?: string
  ): Promise<BunnyVideoResponse> {
    if (!this.apiKey || !this.libraryId) {
      throw new Error(
        "Bunny.net API credentials are required for video upload"
      );
    }

    const url = `https://${this.hostname}/library/${this.libraryId}/videos`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        AccessKey: this.apiKey,
      },
      body: JSON.stringify({
        title,
        collectionId: collectionId || this.collectionId,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create video: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Upload video file to Bunny Stream
   */
  async uploadVideoFile(videoId: string, videoBuffer: Buffer): Promise<void> {
    const url = `https://${this.hostname}/library/${this.libraryId}/videos/${videoId}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        AccessKey: this.apiKey,
        "Content-Type": "application/octet-stream",
      },
      body: videoBuffer,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to upload video file: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Get video details
   */
  async getVideo(videoId: string): Promise<BunnyVideoResponse> {
    const url = `https://${this.hostname}/library/${this.libraryId}/videos/${videoId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        AccessKey: this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get video: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Update video details
   */
  async updateVideo(
    videoId: string,
    updates: Partial<BunnyVideoResponse>
  ): Promise<BunnyVideoResponse> {
    const url = `https://${this.hostname}/library/${this.libraryId}/videos/${videoId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        AccessKey: this.apiKey,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to update video: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Delete a video
   */
  async deleteVideo(videoId: string): Promise<void> {
    const url = `https://${this.hostname}/library/${this.libraryId}/videos/${videoId}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        AccessKey: this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to delete video: ${response.status} ${response.statusText}`
      );
    }
  }

  /**
   * Generate secure token for video playback
   */
  generateSecureToken(params: TokenAuthenticationParams): string {
    const { videoId, expirationTime, userId, ip } = params;

    // Create auth string: securityKey + videoId + expirationTime + (optional userId) + (optional IP)
    let authString = this.tokenAuthKey + videoId + expirationTime;

    if (userId) {
      authString += userId;
    }

    if (ip) {
      authString += ip;
    }

    // Generate SHA256 hash
    const hash = crypto.createHash("sha256");
    hash.update(authString);

    return hash.digest("hex");
  }

  /**
   * Generate secure URL for video playback
   */
  generateSecureUrl(
    videoId: string,
    expirationMinutes: number = 60,
    userId?: string
  ): string {
    const expirationTime =
      Math.floor(Date.now() / 1000) + expirationMinutes * 60;
    const token = this.generateSecureToken({
      videoId,
      expirationTime,
      userId,
    });

    // Build secure URL
    const baseUrl = `https://${this.cdnHostname}/${videoId}/playlist.m3u8`;
    const secureUrl = `${baseUrl}?token=${token}&expires=${expirationTime}`;

    if (userId) {
      return `${secureUrl}&user=${userId}`;
    }

    return secureUrl;
  }

  /**
   * Generate secure iframe URL for embedded player
   */
  generateSecureIframeUrl(
    videoId: string,
    expirationMinutes: number = 60
  ): string {
    const expirationTime =
      Math.floor(Date.now() / 1000) + expirationMinutes * 60;
    const token = this.generateSecureToken({
      videoId,
      expirationTime,
    });

    return `https://iframe.mediadelivery.net/embed/${this.libraryId}/${videoId}?token=${token}&expires=${expirationTime}`;
  }

  /**
   * Get video thumbnail URL
   */
  getThumbnailUrl(videoId: string, thumbnailFileName?: string): string {
    const filename = thumbnailFileName || "thumbnail.jpg";
    return `https://${this.cdnHostname}/${videoId}/${filename}`;
  }

  /**
   * Check if video is ready for playback
   */
  async isVideoReady(videoId: string): Promise<boolean> {
    try {
      const video = await this.getVideo(videoId);
      // Status 4 means video is ready
      return video.status === 4 && video.encodeProgress === 100;
    } catch (error) {
      console.error("Error checking video status:", error);
      return false;
    }
  }

  /**
   * Wait for video to be ready (with timeout)
   */
  async waitForVideoReady(
    videoId: string,
    timeoutMs: number = 300000
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (await this.isVideoReady(videoId)) {
        return true;
      }

      // Wait 5 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    return false;
  }

  /**
   * Set video thumbnail
   */
  async setVideoThumbnail(videoId: string, time: number): Promise<void> {
    const url = `https://${this.hostname}/library/${this.libraryId}/videos/${videoId}/thumbnail`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        AccessKey: this.apiKey,
      },
      body: JSON.stringify({ time }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to set video thumbnail: ${response.status} ${response.statusText}`
      );
    }
  }
}

// Singleton instance
let bunnyService: BunnyService | null = null;

export function getBunnyService(): BunnyService {
  if (!bunnyService) {
    bunnyService = new BunnyService();
  }
  return bunnyService;
}
