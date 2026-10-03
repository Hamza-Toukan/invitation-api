import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({
    example: 'ROYAL20',
    description: 'Promotional discount coupon code',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    example: 'b75f8c69-6523-4527-84bc-5ad26cfcf4b9',
    description: 'ID of the pricing plan being purchased',
  })
  @IsUUID()
  @IsNotEmpty()
  planId!: string;
}
