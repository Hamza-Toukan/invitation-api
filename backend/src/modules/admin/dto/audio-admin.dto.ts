import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAudioDto {
  @ApiProperty({ example: 'زفة أردنية ملكية', description: 'Song or track title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'wedding', description: 'Category (e.g. wedding, graduation, ambient)' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ example: 'https://cdn.aura-invite.com/audio/royal-zaffeh.mp3', description: 'Public URL to audio file' })
  @IsNotEmpty()
  @IsString()
  fileUrl: string;

  @ApiProperty({ example: 180, description: 'Track duration in seconds' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSeconds: number;

  @ApiPropertyOptional({ default: true, description: 'Whether audio is available to hosts' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateAudioDto {
  @ApiPropertyOptional({ example: 'زفة أردنية مطورة' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'wedding' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'https://cdn.aura-invite.com/audio/royal-zaffeh-v2.mp3' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 210 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSeconds?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
