import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsUrl, Min } from 'class-validator';

export class AddGalleryImageDto {
  @ApiProperty({
    description: 'Public URL of the photo uploaded to Cloudflare R2',
    example: 'https://media.invitations.jo/events/gallery/photo-1.webp',
  })
  @IsNotEmpty({ message: 'imageUrl is required' })
  @IsUrl({}, { message: 'imageUrl must be a valid URL' })
  imageUrl: string;

  @ApiProperty({
    description: 'Display order in gallery (default: 0)',
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: 'displayOrder must be an integer' })
  @Min(0, { message: 'displayOrder must be greater than or equal to 0' })
  displayOrder?: number;
}
