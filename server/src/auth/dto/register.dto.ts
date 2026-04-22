import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '+91 98765 43210', description: 'Phone number with country code' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'John Doe', description: 'Display name' })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 6 characters)' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: '+91 98765 43210', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: 'password123', description: 'Password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SendOtpDto {
  @ApiProperty({ example: '+91 98765 43210', description: 'Phone number to send OTP' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+91 98765 43210', description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: '123456', description: 'OTP code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
