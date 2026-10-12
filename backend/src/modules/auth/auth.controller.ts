import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, UpdateProfileDto } from './dto';
import {
  SendOtpResponseDto,
  VerifyOtpResponseDto,
  UserProfileDto,
} from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Send OTP verification code to phone number',
    description:
      'Generates a cryptographically secure 6-digit OTP code, stores its hash, and dispatches it via SMS/WhatsApp. Has a 60-second anti-spam cooldown.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    type: SendOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed: Invalid phone number format',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests: Cooldown active',
  })
  async sendOtp(@Body() dto: SendOtpDto): Promise<SendOtpResponseDto> {
    return this.authService.sendOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Verify OTP code and issue JWT tokens',
    description:
      'Verifies the 6-digit OTP code against the latest active verification record. Automatically registers new users with HOST role or authenticates existing users, issuing JWT Access and Refresh tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP successfully verified and JWT tokens issued',
    type: VerifyOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid code, expired OTP, or maximum attempts exceeded',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<VerifyOtpResponseDto> {
    return this.authService.verifyOtp(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated user profile',
    description:
      'Extracts and validates JWT Bearer token, returning the authenticated user profile. Can be tested directly from Swagger UI after authorizing with the Bearer token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authenticated user profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid JWT Bearer token',
  })
  async getMe(
    @CurrentUser('id') userId: string,
  ): Promise<UserProfileDto> {
    return this.authService.getProfile(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update current authenticated user profile',
    description: 'Updates full name and email address for the logged-in user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Missing or invalid JWT Bearer token',
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.authService.updateProfile(userId, dto);
  }
}

