import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
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
import { CreateAudioDto, UpdateAudioDto, QueryAdminPaginationDto } from '../dto';

@ApiTags('Admin - Audio Library')
@ApiBearerAuth('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/audio-library')
export class AdminAudioController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'List all audio tracks with pagination',
  })
  @ApiResponse({ status: 200, description: 'Paginated audio tracks list' })
  async getAllAudio(@Query() query: QueryAdminPaginationDto) {
    return this.adminService.getAllAudio(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Add a new track to the audio library',
  })
  @ApiResponse({ status: 201, description: 'Audio track created successfully' })
  async createAudio(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: CreateAudioDto,
  ) {
    return this.adminService.createAudio(admin.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing audio track',
  })
  @ApiParam({ name: 'id', description: 'Audio track UUID' })
  @ApiResponse({ status: 200, description: 'Audio track updated successfully' })
  @ApiResponse({ status: 404, description: 'Audio track not found' })
  async updateAudio(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: UpdateAudioDto,
  ) {
    return this.adminService.updateAudio(admin.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an audio track',
  })
  @ApiParam({ name: 'id', description: 'Audio track UUID' })
  @ApiResponse({ status: 200, description: 'Audio track deleted successfully' })
  @ApiResponse({ status: 404, description: 'Audio track not found' })
  async deleteAudio(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminService.deleteAudio(admin.sub, id);
  }
}
