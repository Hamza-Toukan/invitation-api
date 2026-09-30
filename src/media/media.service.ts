import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'node:crypto';
import * as path from 'node:path';
import {
  GeneratePresignedUrlDto,
  MediaUploadPurpose,
  PresignedUrlResponseDto,
} from './dto';
import { I18nService } from '../common/i18n/i18n.service';
import { SupportedLanguage } from '../common/i18n/i18n.types';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicDomain: string;

  constructor(private readonly i18n: I18nService) {
    const accountId = process.env.R2_ACCOUNT_ID ?? '';
    const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? 'dummy-access-key';
    const secretAccessKey =
      process.env.R2_SECRET_ACCESS_KEY ?? 'dummy-secret-key';
    this.bucketName = process.env.R2_BUCKET_NAME ?? 'invitation-media';

    const rawDomain = process.env.R2_PUBLIC_DOMAIN ?? '';
    this.publicDomain = rawDomain
      ? rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
      : `${this.bucketName}.r2.dev`;

    const endpoint =
      process.env.R2_ENDPOINT ||
      (accountId
        ? `https://${accountId}.r2.cloudflarestorage.com`
        : undefined);

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Validates file size constraints, sanitizes filenames, generates unique storage keys,
   * and creates a presigned PUT URL for Cloudflare R2 / S3 storage.
   */
  async generatePresignedUrl(
    dto: GeneratePresignedUrlDto,
    lang: SupportedLanguage = 'ar',
  ): Promise<PresignedUrlResponseDto> {
    // 1. Strict Size Validation
    const isImage = dto.mimeType.startsWith('image/');
    const isAudio = dto.mimeType === 'audio/mpeg';

    const maxImageBytes = 5 * 1024 * 1024; // 5MB
    const maxAudioBytes = 8 * 1024 * 1024; // 8MB

    if (isImage && dto.fileSize > maxImageBytes) {
      throw new BadRequestException(
        `${this.i18n.t('media.file_too_large', lang)} (Images max 5MB)`,
      );
    }

    if (isAudio && dto.fileSize > maxAudioBytes) {
      throw new BadRequestException(
        `${this.i18n.t('media.file_too_large', lang)} (Audio max 8MB)`,
      );
    }

    // 2. Sanitize Filename & Construct Safe Unique Key
    const ext = path.extname(dto.filename).toLowerCase();
    const rawBase = path.basename(dto.filename, ext);
    const sanitizedBase =
      rawBase.replace(/[^a-zA-Z0-9_\-\u0600-\u06FF]/g, '_').slice(0, 50) ||
      'file';

    const folder = this.getFolderByPurpose(dto.purpose);
    const uniqueId = crypto.randomUUID().slice(0, 8);
    const key = `${folder}/${Date.now()}-${uniqueId}-${sanitizedBase}${ext}`;

    const expiresInSeconds = 300; // 5 minutes

    // 3. Generate Signed PUT URL
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: dto.mimeType,
      ContentLength: dto.fileSize,
    });

    let uploadUrl: string;
    try {
      uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
    } catch (error) {
      this.logger.error('Failed to generate presigned R2 upload URL', error);
      throw error;
    }

    const publicUrl = `https://${this.publicDomain}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      key,
      expiresInSeconds,
      message: this.i18n.t('media.presigned_created', lang),
    };
  }

  private getFolderByPurpose(purpose: MediaUploadPurpose): string {
    switch (purpose) {
      case MediaUploadPurpose.EVENT_GALLERY:
        return 'events/gallery';
      case MediaUploadPurpose.EVENT_MUSIC:
        return 'events/music';
      case MediaUploadPurpose.PAYMENT_RECEIPT:
        return 'orders/receipts';
      default:
        return 'misc';
    }
  }
}
