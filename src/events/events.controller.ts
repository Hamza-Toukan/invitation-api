import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { EventsService } from './events.service';
import {
  CreateEventDto,
  UpdateEventDto,
  AddGalleryImageDto,
  EventDetailsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentLanguage } from '../common/i18n/current-language.decorator';
import type { SupportedLanguage } from '../common/i18n/i18n.types';

@ApiTags('Events')
@ApiBearerAuth('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new invitation event (Draft)',
    description:
      'Initializes a new digital event invitation in DRAFT mode under the authenticated host. Accommodates bilingual customization configs.',
  })
  @ApiResponse({
    status: 201,
    description: 'Event invitation draft created successfully',
    type: EventDetailsDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed: Invalid input payload',
  })
  @ApiResponse({ status: 404, description: 'Chosen template does not exist' })
  async createEvent(
    @CurrentUser('id') hostId: string,
    @Body() dto: CreateEventDto,
    @CurrentLanguage() lang: SupportedLanguage,
  ) {
    return this.eventsService.createEvent(hostId, dto, lang);
  }

  @Get('my-events')
  @ApiOperation({
    summary: 'Get all events owned by the authenticated host',
    description:
      'Returns a list of all events created by the logged-in host, including template details, gallery images count, and live RSVP summary.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of host events retrieved successfully',
    type: [EventDetailsDto],
  })
  async getMyEvents(@CurrentUser('id') hostId: string) {
    return this.eventsService.getMyEvents(hostId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get full event details by ID',
    description:
      'Retrieves the full configuration, gallery items, music, and RSVP summary of an event. Only accessible by the event host or administrators.',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({
    status: 200,
    description: 'Event details retrieved successfully',
    type: EventDetailsDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden: You do not own this event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventById(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentLanguage() lang: SupportedLanguage,
  ) {
    return this.eventsService.getEventById(eventId, userId, userRole, lang);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update event invitation details or configuration',
    description:
      'Updates event title, date, location, music, or custom JSON template settings.',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden: You do not own this event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEvent(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: UpdateEventDto,
    @CurrentLanguage() lang: SupportedLanguage,
  ) {
    return this.eventsService.updateEvent(eventId, userId, userRole, dto, lang);
  }

  @Post(':id/gallery')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add an image to the event photo gallery',
    description:
      'Appends a photo URL (typically obtained via Cloudflare R2 presigned URL) to the event gallery.',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiResponse({
    status: 201,
    description: 'Image added to gallery successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden: You do not own this event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async addGalleryImage(
    @Param('id', ParseUUIDPipe) eventId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: AddGalleryImageDto,
    @CurrentLanguage() lang: SupportedLanguage,
  ) {
    return this.eventsService.addGalleryImage(
      eventId,
      userId,
      userRole,
      dto,
      lang,
    );
  }

  @Delete(':id/gallery/:imageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete an image from the event photo gallery',
  })
  @ApiParam({ name: 'id', description: 'Event UUID' })
  @ApiParam({ name: 'imageId', description: 'Gallery image UUID' })
  @ApiResponse({
    status: 200,
    description: 'Image removed from gallery successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden: You do not own this event' })
  @ApiResponse({ status: 404, description: 'Event or image not found' })
  async deleteGalleryImage(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentLanguage() lang: SupportedLanguage,
  ) {
    return this.eventsService.deleteGalleryImage(
      eventId,
      imageId,
      userId,
      userRole,
      lang,
    );
  }
}
