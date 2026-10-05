import { Controller, Post, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { GuestsService } from '../services/guests.service';
import { CheckInDto } from '../dto';

@ApiTags('Reception Check-in')
@ApiBearerAuth('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/check-in')
export class GuestCheckinController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @ApiOperation({
    summary: 'Check in a guest at reception via QR Code hash',
    description:
      'Validates the scanned QR hash against the event guestbook, marks attendance, and returns companion and seating details for screen display.',
  })
  @ApiResponse({
    status: 200,
    description: 'Check-in processed successfully',
    schema: {
      example: {
        alreadyCheckedIn: false,
        checkedInAt: '2026-10-02T18:00:00.000Z',
        guest: {
          id: 'b4a03780-e837-4d16-bd8f-c020d20d7ce9',
          name: 'طارق المصري',
          companionsConfirmed: 2,
          table: 'VIP Table A-1',
        },
        message: 'Guest successfully checked in at reception desk',
      },
    },
  })
  async checkIn(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CheckInDto,
  ) {
    return this.guestsService.checkInGuest(
      eventId,
      dto.qrCodeHash,
      user.sub,
      user.role,
    );
  }
}
