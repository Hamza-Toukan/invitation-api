import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWishDto {
  @ApiProperty({
    example: 'عمر وخالد',
    description: 'Name of the well-wisher',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  authorName!: string;

  @ApiProperty({
    example: 'ألف مبارك وبالرفاه والبنين، بارك الله لكما وجمع بينكما في خير!',
    description: 'Congratulations message or prayer for the hosts',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message!: string;
}
