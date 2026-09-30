import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlResponseDto {
  @ApiProperty({
    description:
      'Presigned Cloudflare R2 / S3 PUT URL for direct client upload',
    example:
      'https://account-id.r2.cloudflarestorage.com/invitation-media/gallery/photo.webp?X-Amz-Algorithm=...',
  })
  uploadUrl: string;

  @ApiProperty({
    description:
      'Permanent public CDN URL accessible to users after upload succeeds',
    example:
      'https://media.invitations.jo/gallery/1727732400-550e8400-photo.webp',
  })
  publicUrl: string;

  @ApiProperty({
    description: 'Unique storage key path of the object inside the bucket',
    example: 'gallery/1727732400-550e8400-photo.webp',
  })
  key: string;

  @ApiProperty({
    description: 'Presigned upload URL expiration time in seconds',
    example: 300,
  })
  expiresInSeconds: number;

  @ApiProperty({
    description: 'Localized status message',
    example: 'Presigned upload URL generated successfully.',
  })
  message: string;
}
