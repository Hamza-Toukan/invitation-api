import {
  Controller,
  Get,
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
import { QueryAdminEventsDto, UpdateEventStatusDto } from '../dto';

@ApiTags('Admin - Events')
@ApiBearerAuth('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/events')
export class AdminEventsController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'List all platform events with pagination and filters',
    description: 'Retrieves all events across hosts, filterable by status (DRAFT, PUBLISHED, EXPIRED) and searchable by title/host.',
  })
  @ApiResponse({ status: 200, description: 'Paginated events list' })
  async getAllEvents(@Query() query: QueryAdminEventsDto) {
    return this.adminService.getAllEvents(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get event administrative details',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'Event details including host and orders' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventDetails(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getAdminEventDetails(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Change event publication status',
    description: 'Allows an administrator to manually publish, draft, or expire an event.',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'Event status updated' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEventStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
    @Body() dto: UpdateEventStatusDto,
  ) {
    return this.adminService.updateEventStatus(admin.sub, id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an event and its relations permanently',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async deleteEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.adminService.deleteEventAsAdmin(admin.sub, id);
  }
}
