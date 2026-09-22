import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { config } from "../config";
import { logger } from "../utils/logger";

/**
 * Defines the interface for a file storage service, allowing for different implementations (local, S3, etc.).
 */
export interface IFileStorageService {
  /**
   * Uploads a file from a base64 string.
   * @param base64Data The base64 encoded file data.
   * @param mimeType The MIME type of the file.
   * @param userId The user ID to organize files by user.
   * @param originalName An optional original name for context.
   * @returns A promise that resolves to the public URL of the uploaded file.
   */
  upload(
    base64Data: string,
    mimeType: string,
    userId: string,
    originalName?: string
  ): Promise<string>;

  /**
   * Deletes all files for a specific user.
   * @param userId The user ID whose files should be deleted.
   * @returns A promise that resolves when all files are deleted.
   */
  deleteUserFiles(userId: string): Promise<void>;
}

/**
 * An implementation of IFileStorageService that saves files to the local server's disk.
 * Ideal for development and simple deployments.
 */
export class LocalFileStorageService implements IFileStorageService {
  private uploadPath: string;
  private publicUrlBase: string;

  constructor() {
    this.uploadPath = config.upload.uploadPath;
    this.publicUrlBase = config.upload.publicUrlBase;
    this.ensureUploadDirectoryExists();
  }

  private async ensureUploadDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
    } catch (error) {
      logger.error("Failed to create upload directory:", error);
      throw error;
    }
  }

  async upload(
    base64Data: string,
    mimeType: string,
    userId: string,
    originalName: string = "upload"
  ): Promise<string> {
    try {
      const buffer = Buffer.from(base64Data, "base64");

      // Create user-specific directory
      const userUploadPath = path.join(this.uploadPath, userId);
      await fs.mkdir(userUploadPath, { recursive: true });

      // Sanitize originalName to prevent path traversal issues
      const safeOriginalName = path.basename(originalName);
      const fileExtension = mimeType.split("/")[1] || "bin";
      const fileName = `${uuidv4()}-${
        path.parse(safeOriginalName).name
      }.${fileExtension}`;
      const filePath = path.join(userUploadPath, fileName);

      await fs.writeFile(filePath, buffer);

      // Construct the public URL
      const publicUrl = `${this.publicUrlBase}/${userId}/${fileName}`;
      logger.info(`File uploaded to ${filePath}. Public URL: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      logger.error("Failed to upload file to local storage:", error);
      throw new Error("File upload failed.");
    }
  }

  async deleteUserFiles(userId: string): Promise<void> {
    try {
      const userUploadPath = path.join(this.uploadPath, userId);
      
      // Check if user directory exists
      try {
        await fs.access(userUploadPath);
      } catch {
        logger.info(`No files found for user ${userId}`);
        return;
      }

      // Remove all files in user directory
      await fs.rm(userUploadPath, { recursive: true, force: true });
      logger.info(`Deleted all files for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to delete files for user ${userId}:`, error);
      throw new Error("Failed to delete user files.");
    }
  }
}

/**
 * An implementation of IFileStorageService that saves files to an AWS S3 bucket.
 * Ideal for production environments.
 */
export class S3FileStorageService implements IFileStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.bucketName = config.storage.s3.bucketName;
    this.region = config.storage.s3.region;
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.storage.s3.accessKeyId,
        secretAccessKey: config.storage.s3.secretAccessKey,
      },
    });
    logger.info(
      `S3 Storage Service initialized for bucket: ${this.bucketName} in region: ${this.region}`
    );
  }

  async upload(
    base64Data: string,
    mimeType: string,
    userId: string,
    originalName: string = "upload"
  ): Promise<string> {
    try {
      const buffer = Buffer.from(base64Data, "base64");

      const safeOriginalName = path.basename(originalName);
      const fileExtension = mimeType.split("/")[1] || "bin";
      const fileName = `${uuidv4()}-${
        path.parse(safeOriginalName).name
      }.${fileExtension}`;
      
      // Create user-specific path
      const s3Key = `users/${userId}/images/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);

      const publicUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${s3Key}`;
      logger.info(`File uploaded to S3. Public URL: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      logger.error("Failed to upload file to S3:", error);
      throw new Error("S3 file upload failed.");
    }
  }

  async deleteUserFiles(userId: string): Promise<void> {
    try {
      const prefix = `users/${userId}/images/`;
      
      // List all objects with the user prefix
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const listResponse = await this.s3Client.send(listCommand);
      
      if (!listResponse.Contents || listResponse.Contents.length === 0) {
        logger.info(`No files found for user ${userId}`);
        return;
      }

      // Prepare objects for deletion
      const objectsToDelete = listResponse.Contents.map(obj => ({ Key: obj.Key! }));

      // Delete all objects
      const deleteCommand = new DeleteObjectsCommand({
        Bucket: this.bucketName,
        Delete: {
          Objects: objectsToDelete,
          Quiet: true,
        },
      });

      await this.s3Client.send(deleteCommand);
      logger.info(`Deleted ${objectsToDelete.length} files for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to delete S3 files for user ${userId}:`, error);
      throw new Error("Failed to delete user files from S3.");
    }
  }
}
