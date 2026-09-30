import { ApiProperty } from '@nestjs/swagger';
import { EventStatus, TemplateCategory } from '@prisma/client';

export class TemplateBriefDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Royal White Floral' })
  name: string;

  @ApiProperty({ example: 'royal-white-floral' })
  slug: string;

  @ApiProperty({ enum: TemplateCategory, example: TemplateCategory.WEDDING })
  category: TemplateCategory;

  @ApiProperty({
    example: 'https://media.invitations.jo/templates/previews/royal-white.webp',
    nullable: true,
  })
  preview_image_url: string | null;
}

export class EventGalleryItemDto {
  @ApiProperty({ example: '770e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({
    example: 'https://media.invitations.jo/events/gallery/photo-1.webp',
  })
  image_url: string;

  @ApiProperty({ example: 0 })
  display_order: number;

  @ApiProperty({ example: '2026-09-30T20:00:00.000Z' })
  createdAt: Date;
}

export class RsvpSummaryDto {
  @ApiProperty({ example: 120, description: 'Total invitations sent' })
  totalGuests: number;

  @ApiProperty({ example: 75, description: 'Confirmed attendees' })
  acceptedCount: number;

  @ApiProperty({ example: 15, description: 'Declined attendees' })
  declinedCount: number;

  @ApiProperty({ example: 30, description: 'Pending responses' })
  pendingCount: number;

  @ApiProperty({ example: 40, description: 'Guests checked in at venue' })
  checkedInCount: number;
}

export class EventDetailsDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440099' })
  host_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  template_id: string;

  @ApiProperty({ example: 'wedding-ahmad-sara-2026', nullable: true })
  slug: string | null;

  @ApiProperty({ enum: EventStatus, example: EventStatus.DRAFT })
  status: EventStatus;

  @ApiProperty({ example: 'حفل زفاف أحمد وسارة' })
  event_title: string;

  @ApiProperty({ example: '2026-10-15T18:00:00.000Z' })
  event_date: Date;

  @ApiProperty({ example: 'فندق الفور سيزونز - عمّان', nullable: true })
  location_name: string | null;

  @ApiProperty({
    example: 'https://maps.google.com/?q=31.9539,35.9106',
    nullable: true,
  })
  location_url: string | null;

  @ApiProperty({ example: { lat: 31.9539, lng: 35.9106 }, nullable: true })
  location_coordinates: Record<string, any> | null;

  @ApiProperty({
    example: 'https://media.invitations.jo/events/music/zaffeh.mp3',
    nullable: true,
  })
  music_url: string | null;

  @ApiProperty({
    example: {
      groomName: { ar: 'أحمد التوكان', en: 'Ahmad Toukan' },
      brideName: { ar: 'سارة العلمي', en: 'Sara Al-Alami' },
    },
    nullable: true,
  })
  custom_config: Record<string, any> | null;

  @ApiProperty({ type: TemplateBriefDto })
  template: TemplateBriefDto;

  @ApiProperty({ type: [EventGalleryItemDto] })
  gallery: EventGalleryItemDto[];

  @ApiProperty({ type: RsvpSummaryDto })
  rsvpSummary: RsvpSummaryDto;

  @ApiProperty({ example: '2026-09-30T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-30T10:00:00.000Z' })
  updatedAt: Date;
}
