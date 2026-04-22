import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface S3UploadResult {
  url: string;
  key: string;
  bucket: string;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3Client: any;
  private bucketName: string;
  private isEnabled = false;
  private region: string;

  constructor(private configService: ConfigService) {
    this.initializeS3();
  }

  private async initializeS3() {
    // AWS S3 is currently disabled - using mock/local storage
    // Uncomment below to enable AWS S3
    /*
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
    this.bucketName = this.configService.get('AWS_S3_BUCKET', 'truecaller-uploads');
    this.region = this.configService.get('AWS_REGION', 'us-east-1');

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn('AWS S3 not configured - file uploads will use local storage');
      this.isEnabled = false;
      return;
    }

    try {
      const { S3Client } = await import('@aws-sdk/client-s3');
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isEnabled = true;
      this.logger.log('AWS S3 initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize S3:', error.message);
      this.isEnabled = false;
    }
    */
    this.bucketName = 'mock-bucket';
    this.region = 'us-east-1';
    this.isEnabled = false;
    this.logger.log('AWS S3 is disabled - using mock storage for uploads');
  }

  async uploadFile(
    fileBuffer: Buffer,
    key: string,
    options: UploadOptions = {},
  ): Promise<S3UploadResult> {
    if (!this.isEnabled) {
      return this.mockUpload(fileBuffer, key);
    }

    /*
    try {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: options.metadata || {},
        ACL: options.isPublic !== false ? 'public-read' : 'private',
      });

      await this.s3Client.send(command);

      // Generate URL
      const url = options.isPublic !== false
        ? `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`
        : await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

      this.logger.debug(`File uploaded to S3: ${key}`);

      return {
        url,
        key,
        bucket: this.bucketName,
      };
    } catch (error) {
      this.logger.error('S3 upload failed:', error.message);
      throw error;
    }
    */
    return this.mockUpload(fileBuffer, key);
  }

  async deleteFile(key: string): Promise<void> {
    if (!this.isEnabled) {
      this.logger.log(`[Mock] Would delete: ${key}`);
      return;
    }

    /*
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }));

      this.logger.debug(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error('S3 delete failed:', error.message);
      throw error;
    }
    */
    this.logger.log(`[Mock] File delete: ${key}`);
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isEnabled) {
      return `https://mock-storage.example.com/${key}`;
    }

    /*
    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error('Failed to generate signed URL:', error.message);
      throw error;
    }
    */
    return `https://mock-storage.example.com/${key}`;
  }

  generateKey(folder: string, filename: string, userId: number): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${folder}/${userId}/${timestamp}_${sanitizedFilename}`;
  }

  private mockUpload(fileBuffer: Buffer, key: string): S3UploadResult {
    this.logger.log(`[Mock Upload] Key: ${key}, Size: ${fileBuffer.length} bytes`);
    // In development, return a mock URL
    return {
      url: `https://mock-storage.example.com/${key}`,
      key,
      bucket: 'mock-bucket',
    };
  }

  isS3Enabled(): boolean {
    return this.isEnabled;
  }
}
