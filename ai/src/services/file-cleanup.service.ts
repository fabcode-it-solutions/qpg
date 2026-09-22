import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import path from "path";
import { config } from "../config";
import { logger } from "../utils/logger";
import { DatabaseService } from "./database.service";

/**
 * Service for cleaning up orphaned files and managing storage
 */
export class FileCleanupService {
  private s3Client?: S3Client;
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
    
    if (config.storage.provider === "s3") {
      this.s3Client = new S3Client({
        region: config.storage.s3.region,
        credentials: {
          accessKeyId: config.storage.s3.accessKeyId,
          secretAccessKey: config.storage.s3.secretAccessKey,
        },
      });
    }
  }

  /**
   * Clean up files for users who haven't been active for a specified number of days
   */
  async cleanupInactiveUserFiles(inactiveDays: number = 30): Promise<void> {
    try {
      logger.info(`Starting cleanup of files for users inactive for ${inactiveDays} days`);
      
      // Get list of inactive users from database
      const inactiveUsers = await this.databaseService.getInactiveUsers(inactiveDays);
      
      if (inactiveUsers.length === 0) {
        logger.info("No inactive users found for cleanup");
        return;
      }

      logger.info(`Found ${inactiveUsers.length} inactive users for file cleanup`);

      for (const userId of inactiveUsers) {
        try {
          await this.deleteUserFiles(userId);
          logger.info(`Cleaned up files for inactive user: ${userId}`);
        } catch (error) {
          logger.error(`Failed to cleanup files for user ${userId}:`, error);
        }
      }

      logger.info(`Completed cleanup of inactive user files`);
    } catch (error) {
      logger.error("Failed to cleanup inactive user files:", error);
      throw error;
    }
  }

  /**
   * Delete all files for a specific user
   */
  private async deleteUserFiles(userId: string): Promise<void> {
    if (config.storage.provider === "s3") {
      await this.deleteS3UserFiles(userId);
    } else {
      await this.deleteLocalUserFiles(userId);
    }
  }

  /**
   * Delete user files from S3
   */
  private async deleteS3UserFiles(userId: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error("S3 client not initialized");
    }

    const prefix = `users/${userId}/images/`;
    
    // List all objects with the user prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: config.storage.s3.bucketName,
      Prefix: prefix,
    });

    const listResponse = await this.s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return;
    }

    // Prepare objects for deletion
    const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key! }));

    // Delete all objects
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: config.storage.s3.bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: true,
      },
    });

    await this.s3Client.send(deleteCommand);
    logger.info(`Deleted ${objectsToDelete.length} S3 files for user ${userId}`);
  }

  /**
   * Delete user files from local storage
   */
  private async deleteLocalUserFiles(userId: string): Promise<void> {
    const userUploadPath = path.join(config.upload.uploadPath, userId);
    
    // Check if user directory exists
    try {
      await fs.access(userUploadPath);
    } catch {
      return; // Directory doesn't exist, nothing to clean
    }

    // Remove all files in user directory
    await fs.rm(userUploadPath, { recursive: true, force: true });
    logger.info(`Deleted local files for user ${userId}`);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalUsers: number;
    totalFiles: number;
    totalSize: number;
  }> {
    if (config.storage.provider === "s3") {
      return this.getS3StorageStats();
    } else {
      return this.getLocalStorageStats();
    }
  }

  /**
   * Get S3 storage statistics
   */
  private async getS3StorageStats(): Promise<{
    totalUsers: number;
    totalFiles: number;
    totalSize: number;
  }> {
    if (!this.s3Client) {
      throw new Error("S3 client not initialized");
    }

    const listCommand = new ListObjectsV2Command({
      Bucket: config.storage.s3.bucketName,
      Prefix: "users/",
    });

    const response = await this.s3Client.send(listCommand);
    const objects = response.Contents || [];

    const users = new Set<string>();
    let totalSize = 0;

    objects.forEach(obj => {
      if (obj.Key && obj.Size) {
        const userMatch = obj.Key.match(/^users\/([^\/]+)\//);
        if (userMatch) {
          users.add(userMatch[1]);
        }
        totalSize += obj.Size;
      }
    });

    return {
      totalUsers: users.size,
      totalFiles: objects.length,
      totalSize,
    };
  }

  /**
   * Get local storage statistics
   */
  private async getLocalStorageStats(): Promise<{
    totalUsers: number;
    totalFiles: number;
    totalSize: number;
  }> {
    const uploadPath = config.upload.uploadPath;
    
    try {
      const userDirs = await fs.readdir(uploadPath);
      let totalFiles = 0;
      let totalSize = 0;

      for (const userDir of userDirs) {
        const userPath = path.join(uploadPath, userDir);
        const stat = await fs.stat(userPath);
        
        if (stat.isDirectory()) {
          const files = await fs.readdir(userPath);
          totalFiles += files.length;
          
          for (const file of files) {
            const filePath = path.join(userPath, file);
            const fileStat = await fs.stat(filePath);
            totalSize += fileStat.size;
          }
        }
      }

      return {
        totalUsers: userDirs.length,
        totalFiles,
        totalSize,
      };
    } catch (error) {
      logger.error("Failed to get local storage stats:", error);
      return { totalUsers: 0, totalFiles: 0, totalSize: 0 };
    }
  }
}