import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { DATABASE_CONNECTION } from '../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';

describe('AuthService', () => {
  let service: AuthService;

  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([]),
  };

  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DATABASE_CONNECTION, useValue: mockDb },
        { provide: REDIS_CLIENT, useValue: mockRedis },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validatePhoneNumber', () => {
    it('should validate Indian phone numbers correctly', () => {
      expect(service['validatePhoneNumber']('+919876543210')).toBe(true);
      expect(service['validatePhoneNumber']('9876543210')).toBe(true);
      expect(service['validatePhoneNumber']('12345')).toBe(false);
      expect(service['validatePhoneNumber']('')).toBe(false);
    });
  });

  describe('generateOTP', () => {
    it('should generate 6 digit OTP', () => {
      const otp = service['generateOTP']();
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });

    it('should generate different OTPs', () => {
      const otp1 = service['generateOTP']();
      const otp2 = service['generateOTP']();
      expect(otp1).not.toBe(otp2);
    });
  });
});
