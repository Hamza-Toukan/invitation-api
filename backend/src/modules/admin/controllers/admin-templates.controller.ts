import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { AdminService } from '../services/admin.service';
import { CreateTemplateDto, UpdateTemplateDto } from '../dto';

@ApiTags('Admin - Templates')
@ApiBearerAuth('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/templates')
export class AdminTemplatesController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'List all templates (active & inactive)',
    description: 'Retrieves all templates with event usage counts.',
  })
  @ApiResponse({ status: 200, description: 'List of templates' })
  async getAllTemplates() {
    return this.adminService.getAllTemplates();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new invitation template',
    description: 'Adds a new design template with default configuration JSON.',
  })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.adminService.createTemplate(admin.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing template',
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.adminService.updateTemplate(admin.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete or deactivate a template',
    description: 'Deletes template permanently or marks it inactive if in use by events.',
  })
  @ApiParam({ name: 'id', description: 'Template UUID' })
  @ApiResponse({ status: 200, description: 'Template deleted or deactivated' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async deleteTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminService.deleteTemplate(admin.sub, id);
  }
}
