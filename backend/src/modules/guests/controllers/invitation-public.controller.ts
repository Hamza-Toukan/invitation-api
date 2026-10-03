import {
  Controller,
  Get,
  Post,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Cacheable } from '../../../core/cache/cacheable.decorator';
import { RsvpService } from '../services/rsvp.service';
import { SubmitRsvpDto, CreateWishDto } from '../dto';

@ApiTags('Public Invitations')
@Controller('invitations')
export class InvitationPublicController {
  constructor(private readonly rsvpService: RsvpService) {}

  @Get(':token')
  @Cacheable({ ttlSeconds: 30, keyPrefix: 'invitation:token' })
  @ApiOperation({
    summary: 'Fetch invitation details by secret token',
    description:
      'Public endpoint used by web visitors to view the interactive invitation, event itinerary, location, and personalized companion allowance.',
  })
  @ApiResponse({ status: 200, description: 'Invitation details retrieved' })
  async getInvitation(@Param('token') token: string) {
    return this.rsvpService.getInvitationByToken(token);
  }

  @Post(':token/rsvp')
  @ApiOperation({
    summary: 'Submit or update RSVP attendance decision',
    description:
      'Allows invited guests to confirm attendance (ACCEPTED) or decline (DECLINED), specify confirmed companions, and submit dietary/attendance notes.',
  })
  @ApiResponse({ status: 200, description: 'RSVP recorded successfully' })
  async submitRsvp(
    @Param('token') token: string,
    @Body() dto: SubmitRsvpDto,
  ) {
    return this.rsvpService.submitRsvp(token, dto);
  }

  @Post(':token/wishes')
  @ApiOperation({
    summary: 'Send congratulatory wish to event guestbook',
    description:
      'Allows guests to post digital wishes and prayers to the couple or hosts.',
  })
  @ApiResponse({ status: 201, description: 'Wish published to guestbook' })
  async submitWish(
    @Param('token') token: string,
    @Body() dto: CreateWishDto,
  ) {
    return this.rsvpService.submitWish(token, dto);
  }

  @Get(':token/wishes')
  @ApiOperation({
    summary: 'Get all guestbook wishes for this invitation event',
    description: 'Retrieves approved congratulations messages displayed on the invitation page.',
  })
  @ApiResponse({ status: 200, description: 'List of guest wishes' })
  async getWishes(@Param('token') token: string) {
    return this.rsvpService.getEventWishes(token);
  }
}
