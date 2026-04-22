import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { users, profiles, User, NewUser, NewProfile } from '../database/schema';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { SMSService } from '../sms/sms.service';
import { RegisterDto, LoginDto, SendOtpDto, VerifyOtpDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private jwtService: JwtService,
    private configService: ConfigService,
    private smsService: SMSService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.db.select()
      .from(users)
      .where(eq(users.phoneNumber, dto.phoneNumber))
      .limit(1);

    if (existingUser.length > 0) {
      throw new BadRequestException('Phone number already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Generate OTP
    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const [newUser] = await this.db.insert(users).values({
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      passwordHash,
      verificationCode: otp,
      verificationCodeExpiry: otpExpiry,
      isVerified: false,
      settings: {
        darkMode: true,
        notifications: true,
        privacyLevel: 'contacts',
        language: 'en',
      },
    } as NewUser).returning();

    // Create profile
    await this.db.insert(profiles).values({
      userId: newUser.id,
      displayName: dto.displayName,
      trustLevel: 'neutral',
      riskScore: 'low',
      trustScore: 50,
    } as NewProfile);

    // Send OTP (mock for now)
    await this.sendOtpSms(dto.phoneNumber, otp);

    // Store OTP in Redis for quick lookup
    await this.redis.setex(`otp:${dto.phoneNumber}`, 600, otp);

    return {
      message: 'Registration successful. Please verify your phone number.',
      userId: newUser.id,
      requiresVerification: true,
    };
  }

  async login(dto: LoginDto) {
    const [user] = await this.db.select()
      .from(users)
      .where(eq(users.phoneNumber, dto.phoneNumber))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Phone number not verified. Please verify first.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async sendOtp(dto: SendOtpDto) {
    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with new OTP
    await this.db.update(users)
      .set({
        verificationCode: otp,
        verificationCodeExpiry: otpExpiry,
      })
      .where(eq(users.phoneNumber, dto.phoneNumber));

    // Send OTP via SMS service
    await this.smsService.sendOTP(dto.phoneNumber, otp);

    // Store in Redis
    await this.redis.setex(`otp:${dto.phoneNumber}`, 600, otp);

    return {
      message: 'OTP sent successfully',
      expiresIn: 600, // 10 minutes
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    // Check Redis first
    const cachedOtp = await this.redis.get(`otp:${dto.phoneNumber}`);
    
    if (cachedOtp && cachedOtp === dto.code) {
      // OTP matches from cache
      await this.markUserVerified(dto.phoneNumber);
      await this.redis.del(`otp:${dto.phoneNumber}`);
      
      const [user] = await this.db.select()
        .from(users)
        .where(eq(users.phoneNumber, dto.phoneNumber))
        .limit(1);

      const tokens = await this.generateTokens(user);

      return {
        message: 'Phone number verified successfully',
        user: this.sanitizeUser(user),
        ...tokens,
      };
    }

    // Fallback to database check
    const [user] = await this.db.select()
      .from(users)
      .where(eq(users.phoneNumber, dto.phoneNumber))
      .limit(1);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.verificationCode !== dto.code) {
      throw new BadRequestException('Invalid OTP');
    }

    if (new Date() > user.verificationCodeExpiry) {
      throw new BadRequestException('OTP has expired');
    }

    await this.markUserVerified(dto.phoneNumber);

    const tokens = await this.generateTokens(user);

    return {
      message: 'Phone number verified successfully',
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const [user] = await this.db.select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async markUserVerified(phoneNumber: string) {
    await this.db.update(users)
      .set({
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      })
      .where(eq(users.phoneNumber, phoneNumber));

    // Update profile trust level
    const [user] = await this.db.select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber))
      .limit(1);

    if (user) {
      await this.db.update(profiles)
        .set({
          trustLevel: 'trusted',
          isVerified: true,
        })
        .where(eq(profiles.userId, user.id));
    }
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      phoneNumber: user.phoneNumber,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.configService.get('JWT_REFRESH_SECRET', 'refresh-secret'),
    });

    // Store refresh token hash in Redis
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.redis.setex(`refresh:${user.id}`, 7 * 24 * 60 * 60, refreshHash);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendOtpSms(phoneNumber: string, otp: string): Promise<void> {
    // Mock SMS sending - integrate with Twilio or other SMS provider
    console.log(`📱 OTP for ${phoneNumber}: ${otp}`);
    // TODO: Implement actual SMS sending with Twilio
  }

  private sanitizeUser(user: User) {
    const { passwordHash, verificationCode, ...sanitized } = user;
    return sanitized;
  }

  async validateUser(userId: number) {
    const [user] = await this.db.select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.sanitizeUser(user);
  }
}
