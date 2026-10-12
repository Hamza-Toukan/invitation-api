import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TemplateCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'List active invitation templates',
    description: 'Returns available design templates filtered optionally by category (WEDDING, ENGAGEMENT, GRADUATION).',
  })
  @ApiQuery({ name: 'category', enum: TemplateCategory, required: false })
  @ApiResponse({ status: 200, description: 'List of active templates' })
  async getActiveTemplates(@Query('category') category?: TemplateCategory) {
    return this.prisma.template.findMany({
      where: {
        is_active: true,
        ...(category ? { category } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        preview_image_url: true,
        default_config: true,
      },
    });
  }

  @Get(':slugOrId')
  @ApiOperation({
    summary: 'Get template details by slug or ID',
    description: 'Retrieves template configuration and details.',
  })
  @ApiResponse({ status: 200, description: 'Template details' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(@Param('slugOrId') slugOrId: string) {
    return this.prisma.template.findFirst({
      where: {
        is_active: true,
        OR: [
          { id: slugOrId },
          { slug: slugOrId },
        ],
      },
    });
  }
}
