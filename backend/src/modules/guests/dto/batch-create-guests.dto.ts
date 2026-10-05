import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateGuestDto } from './create-guest.dto';

export class BatchCreateGuestsDto {
  @ApiProperty({
    type: [CreateGuestDto],
    description: 'Array of guests to create in bulk',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateGuestDto)
  guests!: CreateGuestDto[];
}
