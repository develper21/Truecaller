import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { S3Service, S3UploadResult } from './s3.service';
import { DATABASE_CONNECTION } from '../database/database.module';
import { profiles, businessAccounts } from '../database/schema';
import { eq } from 'drizzle-orm';

export interface UploadFileResult extends S3UploadResult {
  originalName: string;
  size: number;
  mimeType: string;
}

export type UploadFolder = 'avatars' | 'business-logos' | 'verification-docs' | 'message-media' | 'call-recordings';

@Injectable()
export class UploadService {
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private readonly allowedDocumentTypes = ['application/pdf', 'image/jpeg', 'image/png'];

  constructor(
    private s3Service: S3Service,
    @Inject(DATABASE_CONNECTION) private db: any,
  ) {}

  async uploadAvatar(
    file: Express.Multer.File,
    userId: number,
  ): Promise<UploadFileResult> {
    // Validate file
    this.validateImageFile(file);

    // Generate S3 key
    const key = this.s3Service.generateKey('avatars', file.originalname, userId);

    // Upload to S3
    const result = await this.s3Service.uploadFile(file.buffer, key, {
      contentType: file.mimetype,
      isPublic: true,
      metadata: {
        userId: String(userId),
        type: 'avatar',
      },
    });

    // Update profile with new avatar URL
    await this.db
      .update(profiles)
      .set({
        avatarUrl: result.url,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    return {
      ...result,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async uploadBusinessLogo(
    file: Express.Multer.File,
    userId: number,
    businessId: number,
  ): Promise<UploadFileResult> {
    // Validate file
    this.validateImageFile(file);

    // Generate S3 key
    const key = this.s3Service.generateKey('business-logos', file.originalname, businessId);

    // Upload to S3
    const result = await this.s3Service.uploadFile(file.buffer, key, {
      contentType: file.mimetype,
      isPublic: true,
      metadata: {
        userId: String(userId),
        businessId: String(businessId),
        type: 'business-logo',
      },
    });

    // Update business account with new logo URL
    await this.db
      .update(businessAccounts)
      .set({
        logoUrl: result.url,
        updatedAt: new Date(),
      })
      .where(eq(businessAccounts.id, businessId));

    return {
      ...result,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async uploadVerificationDocument(
    file: Express.Multer.File,
    userId: number,
    businessId: number,
    docType: string,
  ): Promise<UploadFileResult> {
    // Validate file
    this.validateDocumentFile(file);

    // Generate S3 key
    const key = this.s3Service.generateKey('verification-docs', file.originalname, businessId);

    // Upload to S3 (private)
    const result = await this.s3Service.uploadFile(file.buffer, key, {
      contentType: file.mimetype,
      isPublic: false,
      metadata: {
        userId: String(userId),
        businessId: String(businessId),
        docType,
        type: 'verification-doc',
      },
    });

    // Get current verification documents
    const [business] = await this.db
      .select()
      .from(businessAccounts)
      .where(eq(businessAccounts.id, businessId))
      .limit(1);

    const currentDocs = business?.verificationDocuments || [];

    // Add new document
    const updatedDocs = [
      ...currentDocs,
      {
        type: docType,
        url: result.url,
        key: result.key,
        uploadedAt: new Date(),
        verified: false,
      },
    ];

    // Update business account
    await this.db
      .update(businessAccounts)
      .set({
        verificationDocuments: updatedDocs,
        updatedAt: new Date(),
      })
      .where(eq(businessAccounts.id, businessId));

    return {
      ...result,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async uploadMessageMedia(
    file: Express.Multer.File,
    userId: number,
    threadId: number,
  ): Promise<UploadFileResult> {
    // Validate file
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Generate S3 key
    const key = this.s3Service.generateKey('message-media', file.originalname, userId);

    // Upload to S3
    const result = await this.s3Service.uploadFile(file.buffer, key, {
      contentType: file.mimetype,
      isPublic: false,
      metadata: {
        userId: String(userId),
        threadId: String(threadId),
        type: 'message-media',
      },
    });

    return {
      ...result,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async uploadCallRecording(
    file: Express.Multer.File,
    userId: number,
    callId: string,
  ): Promise<UploadFileResult> {
    // Validate file (recordings can be larger)
    const maxRecordingSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxRecordingSize) {
      throw new BadRequestException('Recording file size exceeds 50MB limit');
    }

    // Generate S3 key
    const sanitizedCallId = callId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `call-recordings/${userId}/${sanitizedCallId}/${Date.now()}.mp3`;

    // Upload to S3 (private, encrypted)
    const result = await this.s3Service.uploadFile(file.buffer, key, {
      contentType: file.mimetype || 'audio/mpeg',
      isPublic: false,
      metadata: {
        userId: String(userId),
        callId,
        type: 'call-recording',
      },
    });

    return {
      ...result,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype || 'audio/mpeg',
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Service.deleteFile(key);
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    return this.s3Service.getSignedUrl(key, expiresIn);
  }

  private validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('Image file size exceeds 10MB limit');
    }

    if (!this.allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${this.allowedImageTypes.join(', ')}`,
      );
    }
  }

  private validateDocumentFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('Document file size exceeds 10MB limit');
    }

    if (!this.allowedDocumentTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${this.allowedDocumentTypes.join(', ')}`,
      );
    }
  }
}
