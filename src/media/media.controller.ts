import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { GeneratePresignedUrlDto, PresignedUrlResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentLanguage } from '../common/i18n/current-language.decorator';
import type { SupportedLanguage } from '../common/i18n/i18n.types';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate Cloudflare R2 presigned upload URL',
    description:
      'Generates a temporary signed PUT URL (valid for 5 minutes) directly pointing to Cloudflare R2 object storage. Uploaded files can immediately be served via public CDN.',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned upload URL created successfully',
    type: PresignedUrlResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'File size exceeds limit or MIME type is not allowed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid JWT Bearer token',
  })
  async generatePresignedUrl(
    @Body() dto: GeneratePresignedUrlDto,
    @CurrentLanguage() lang: SupportedLanguage,
  ): Promise<PresignedUrlResponseDto> {
    return this.mediaService.generatePresignedUrl(dto, lang);
  }
}
