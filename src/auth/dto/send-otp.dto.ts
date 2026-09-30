import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description:
      'Phone number in Jordanian national format (079xxxxxxx, 078xxxxxxx, 077xxxxxxx) or international E.164 format (+96279xxxxxxx)',
    example: '0791234567',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^(\+?962|0)?7[789]\d{7}$|^\+[1-9]\d{6,14}$/, {
    message:
      'Phone number must be a valid Jordanian number (e.g. 0791234567, +962791234567) or valid E.164 international format',
  })
  phoneNumber: string;
}
