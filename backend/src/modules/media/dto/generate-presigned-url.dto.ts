import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Matches,
  Max,
} from 'class-validator';

export enum MediaUploadPurpose {
  EVENT_GALLERY = 'EVENT_GALLERY',
  EVENT_MUSIC = 'EVENT_MUSIC',
  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export class GeneratePresignedUrlDto {
  @ApiProperty({
    description: 'Original name of the file to be uploaded',
    example: 'invitation-cover.webp',
  })
  @IsNotEmpty({ message: 'Filename is required' })
  @IsString({ message: 'Filename must be a string' })
  filename: string;

  @ApiProperty({
    description: 'MIME type of the media file',
    example: 'image/webp',
    enum: ALLOWED_MIME_TYPES,
  })
  @IsNotEmpty({ message: 'MIME type is required' })
  @IsString({ message: 'MIME type must be a string' })
  @Matches(/^(image\/jpeg|image\/png|image\/webp|audio\/mpeg)$/, {
    message:
      'Unsupported MIME type. Allowed types: image/jpeg, image/png, image/webp, audio/mpeg',
  })
  mimeType: string;

  @ApiProperty({
    description:
      'File size in bytes (Images max 5MB: 5242880, Audio max 8MB: 8388608)',
    example: 2048576,
  })
  @IsNotEmpty({ message: 'File size is required' })
  @IsInt({ message: 'File size must be an integer' })
  @IsPositive({ message: 'File size must be positive' })
  @Max(8 * 1024 * 1024, {
    message: 'File size cannot exceed the absolute maximum limit of 8MB',
  })
  fileSize: number;

  @ApiProperty({
    description: 'Intended purpose and destination category of the media file',
    enum: MediaUploadPurpose,
    example: MediaUploadPurpose.EVENT_GALLERY,
  })
  @IsNotEmpty({ message: 'Purpose is required' })
  @IsEnum(MediaUploadPurpose, {
    message:
      'Purpose must be one of: EVENT_GALLERY, EVENT_MUSIC, PAYMENT_RECEIPT',
  })
  purpose: MediaUploadPurpose;
}
