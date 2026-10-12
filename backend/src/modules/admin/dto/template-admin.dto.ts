import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateCategory } from '@prisma/client';

export class CreateTemplateDto {
  @ApiProperty({ example: 'ملكي ذهبي', description: 'Template display name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'royal-gold', description: 'Unique template slug identifier' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({ enum: TemplateCategory, example: TemplateCategory.WEDDING, description: 'Template category' })
  @IsNotEmpty()
  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @ApiPropertyOptional({ example: 'https://cdn.aura-invite.com/templates/royal-gold.jpg', description: 'Preview thumbnail URL' })
  @IsOptional()
  @IsString()
  previewImageUrl?: string;

  @ApiProperty({ example: { primaryColor: '#D4AF37', font: 'Amiri' }, description: 'Default template JSON configuration' })
  @IsNotEmpty()
  @IsObject()
  defaultConfig: Record<string, any>;

  @ApiPropertyOptional({ default: true, description: 'Whether template is active and visible to hosts' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ example: 'ملكي ذهبي مطوّر' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'royal-gold' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ enum: TemplateCategory })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({ example: 'https://cdn.aura-invite.com/templates/royal-gold-v2.jpg' })
  @IsOptional()
  @IsString()
  previewImageUrl?: string;

  @ApiPropertyOptional({ example: { primaryColor: '#D4AF37', font: 'Amiri' } })
  @IsOptional()
  @IsObject()
  defaultConfig?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
