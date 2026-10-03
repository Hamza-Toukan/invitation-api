import { BadRequestException } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaUploadPurpose } from './dto';
import { I18nService } from '../../common/i18n/i18n.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://mock-r2.com/signed-upload-url'),
}));

describe('MediaService', () => {
  let service: MediaService;
  let i18nService: I18nService;

  beforeEach(() => {
    i18nService = new I18nService();
    service = new MediaService(i18nService);
  });

  describe('generatePresignedUrl', () => {
    it('should throw BadRequestException if an image exceeds 5MB', async () => {
      const dto = {
        filename: 'large-photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 6 * 1024 * 1024, // 6MB
        purpose: MediaUploadPurpose.EVENT_GALLERY,
      };

      await expect(service.generatePresignedUrl(dto, 'en')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if an audio file exceeds 8MB', async () => {
      const dto = {
        filename: 'heavy-song.mp3',
        mimeType: 'audio/mpeg',
        fileSize: 9 * 1024 * 1024, // 9MB
        purpose: MediaUploadPurpose.EVENT_MUSIC,
      };

      await expect(service.generatePresignedUrl(dto, 'en')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should generate a presigned PUT URL and safe sanitized key for valid image', async () => {
      const dto = {
        filename: 'my cool wedding photo (1).webp',
        mimeType: 'image/webp',
        fileSize: 2 * 1024 * 1024, // 2MB
        purpose: MediaUploadPurpose.EVENT_GALLERY,
      };

      const result = await service.generatePresignedUrl(dto, 'ar');

      expect(result.uploadUrl).toBe('https://mock-r2.com/signed-upload-url');
      expect(result.key).toMatch(/^events\/gallery\/\d+-[a-f0-9]+-my_cool_wedding_photo__1_\.webp$/);
      expect(result.publicUrl).toContain(result.key);
      expect(result.expiresInSeconds).toBe(300);
      expect(result.message).toBeDefined();
    });

    it('should organize payment receipts under orders/receipts folder', async () => {
      const dto = {
        filename: 'cliq-receipt.png',
        mimeType: 'image/png',
        fileSize: 500 * 1024,
        purpose: MediaUploadPurpose.PAYMENT_RECEIPT,
      };

      const result = await service.generatePresignedUrl(dto, 'ar');
      expect(result.key).toMatch(/^orders\/receipts\//);
    });
  });
});
