import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description:
      'Phone number in Jordanian national format (079xxxxxxx) or international E.164 format (+96279xxxxxxx)',
    example: '0791234567',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^(\+?962|0)?7[789]\d{7}$|^\+[1-9]\d{6,14}$/, {
    message:
      'Phone number must be a valid Jordanian number (e.g. 0791234567, +962791234567) or valid E.164 international format',
  })
  phoneNumber: string;

  @ApiProperty({
    description: '6-digit verification code received via SMS/WhatsApp',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty({ message: 'Verification code is required' })
  @IsString({ message: 'Verification code must be a string' })
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Verification code must contain digits only' })
  code: string;
}
