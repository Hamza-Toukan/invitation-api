import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Audio Library')
@Controller('audio-library')
export class AudioLibraryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'List available audio tracks and zaffeh tunes',
    description: 'Returns available background music and celebration songs for invitations.',
  })
  @ApiQuery({ name: 'category', type: String, required: false, description: 'Filter by category (e.g. wedding, graduation, ambient)' })
  @ApiResponse({ status: 200, description: 'List of active audio tracks' })
  async getActiveAudio(@Query('category') category?: string) {
    return this.prisma.audioLibrary.findMany({
      where: {
        is_active: true,
        ...(category ? { category: { equals: category, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        category: true,
        file_url: true,
        duration_seconds: true,
      },
    });
  }

  @Get('categories')
  @ApiOperation({
    summary: 'List unique audio categories',
    description: 'Returns available audio categories for filtering.',
  })
  @ApiResponse({ status: 200, description: 'List of distinct audio categories' })
  async getCategories() {
    const categories = await this.prisma.audioLibrary.findMany({
      where: { is_active: true },
      distinct: ['category'],
      select: { category: true },
    });
    return categories.map((c) => c.category);
  }
}
