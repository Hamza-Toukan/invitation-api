import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class LocationCoordinatesDto {
  @ApiProperty({ example: 31.9539, description: 'Latitude' })
  lat: number;

  @ApiProperty({ example: 35.9106, description: 'Longitude' })
  lng: number;
}

export class CreateEventDto {
  @ApiProperty({
    description: 'UUID of the chosen invitation template',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty({ message: 'templateId is required' })
  @IsUUID('4', { message: 'templateId must be a valid UUID' })
  templateId: string;

  @ApiProperty({
    description: 'Event title',
    example: 'حفل زفاف أحمد وسارة',
  })
  @IsNotEmpty({ message: 'eventTitle is required' })
  @IsString({ message: 'eventTitle must be a string' })
  eventTitle: string;

  @ApiProperty({
    description: 'Event date and time in ISO 8601 format',
    example: '2026-10-15T18:00:00.000Z',
  })
  @IsNotEmpty({ message: 'eventDate is required' })
  @IsDateString(
    {},
    { message: 'eventDate must be a valid ISO 8601 date string' },
  )
  eventDate: string;

  @ApiProperty({
    description: 'Venue / hall name',
    example: 'فندق الفور سيزونز - عمّان',
    required: false,
  })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiProperty({
    description: 'Map location URL (Google Maps or Waze)',
    example: 'https://maps.google.com/?q=31.9539,35.9106',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'locationUrl must be a valid URL' })
  locationUrl?: string;

  @ApiProperty({
    description: 'Geographical coordinates (latitude and longitude)',
    type: LocationCoordinatesDto,
    required: false,
  })
  @IsOptional()
  @IsObject()
  locationCoordinates?: { lat: number; lng: number };

  @ApiProperty({
    description: 'Custom background music or zaffeh track URL',
    example: 'https://media.invitations.jo/events/music/zaffeh.mp3',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'musicUrl must be a valid URL' })
  musicUrl?: string;

  @ApiProperty({
    description:
      'Custom template configuration accommodating bilingual fields (e.g. brideName, groomName, dressCode)',
    example: {
      groomName: { ar: 'أحمد التوكان', en: 'Ahmad Toukan' },
      brideName: { ar: 'سارة العلمي', en: 'Sara Al-Alami' },
      welcomeMessage: {
        ar: 'نتشرف بدعوتكم لمشاركتنا فرحتنا',
        en: 'We invite you to share our special day',
      },
      dressCode: { ar: 'رسمي', en: 'Black Tie / Formal' },
    },
    required: false,
  })
  @IsOptional()
  @IsObject()
  customConfig?: Record<string, any>;
}
