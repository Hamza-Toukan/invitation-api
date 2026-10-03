import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
  HttpStatus,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { BypassTransform } from '../../../core/interceptors/bypass-transform.decorator';
import { GuestsService } from '../services/guests.service';
import {
  CreateGuestDto,
  BatchCreateGuestsDto,
  QueryGuestsDto,
} from '../dto';

@ApiTags('Host Guests')
@ApiBearerAuth('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/guests')
export class GuestAdminController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @ApiOperation({
    summary: 'Add an individual guest to event',
    description:
      'Creates a guest record and automatically generates a unique URL-safe invitation token and QR code hash.',
  })
  @ApiResponse({ status: 201, description: 'Guest successfully created' })
  async createGuest(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateGuestDto,
  ) {
    return this.guestsService.createGuest(eventId, user.sub, dto, user.role);
  }

  @Post('batch')
  @ApiOperation({
    summary: 'Batch add multiple guests',
    description: 'Creates up to 200 guests in a single transactional payload.',
  })
  @ApiResponse({ status: 201, description: 'Batch guests created successfully' })
  async createGuestsBatch(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: BatchCreateGuestsDto,
  ) {
    return this.guestsService.createGuestsBatch(eventId, user.sub, dto, user.role);
  }

  @Post('import-excel')
  @ApiOperation({
    summary: 'Bulk import guests from Excel spreadsheet',
    description:
      'Accepts raw binary or multipart Excel (.xlsx) file buffer, maps columns, and imports guests in bulk.',
  })
  @ApiConsumes('application/octet-stream', 'multipart/form-data')
  @ApiBody({
    description: 'Binary Excel (.xlsx) file content',
  })
  @ApiResponse({ status: 201, description: 'Guests imported successfully' })
  async importExcel(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: FastifyRequest,
  ) {
    // Collect binary buffer from Fastify request stream
    const chunks: Buffer[] = [];
    for await (const chunk of req.raw as AsyncIterable<unknown>) {
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
      } else if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      }
    }
    const buffer = Buffer.concat(chunks);

    return this.guestsService.importGuestsFromExcel(eventId, user.sub, buffer, user.role);
  }

  @Get('export-excel')
  @BypassTransform()
  @ApiOperation({
    summary: 'Export event guests to formatted Excel sheet',
    description:
      'Generates a downloadable Excel file containing all guests, contact information, attendance status, and notes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Binary Excel file stream (.xlsx)',
  })
  async exportExcel(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: JwtPayload,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.guestsService.exportGuestsToExcel(
      eventId,
      user.sub,
      user.role,
    );

    reply
      .status(HttpStatus.OK)
      .header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      .header(
        'Content-Disposition',
        `attachment; filename="guests-${eventId}.xlsx"`,
      )
      .send(buffer);
  }

  @Get()
  @ApiOperation({
    summary: 'List event guests with pagination and filters',
    description:
      'Filter guests by RSVP status (PENDING, ACCEPTED, DECLINED), check-in status, or text search.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of guests' })
  async getGuests(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryGuestsDto,
  ) {
    return this.guestsService.getGuests(eventId, user.sub, query, user.role);
  }

  @Delete(':guestId')
  @ApiOperation({ summary: 'Delete an event guest' })
  @ApiResponse({ status: 200, description: 'Guest successfully deleted' })
  async deleteGuest(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('guestId', ParseUUIDPipe) guestId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guestsService.deleteGuest(eventId, guestId, user.sub, user.role);
  }

  @Get(':guestId/pass-pdf')
  @BypassTransform()
  @ApiOperation({
    summary: 'Download VIP Guest Pass PDF',
    description:
      'Generates and streams a personalized single-page VIP entry pass PDF with embedded QR Code.',
  })
  @ApiResponse({ status: 200, description: 'Binary PDF file stream' })
  async getGuestPassPdf(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('guestId', ParseUUIDPipe) guestId: string,
    @CurrentUser() user: JwtPayload,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.guestsService.generateGuestPassPdf(
      eventId,
      guestId,
      user.sub,
      user.role,
    );

    reply
      .status(HttpStatus.OK)
      .header('Content-Type', 'application/pdf')
      .header(
        'Content-Disposition',
        `attachment; filename="pass-${guestId}.pdf"`,
      )
      .send(buffer);
  }
}
