import { Test, TestingModule } from '@nestjs/testing';
import { PhoneNumbersService } from './phone-numbers.service';
import { DATABASE_CONNECTION } from '../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';

describe('PhoneNumbersService', () => {
  let service: PhoneNumbersService;

  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 1, number: '+919876543210' }]),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };

  const mockRedis = {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhoneNumbersService,
        { provide: DATABASE_CONNECTION, useValue: mockDb },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<PhoneNumbersService>(PhoneNumbersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizePhoneNumber', () => {
    it('should normalize Indian numbers', () => {
      expect(service['normalizePhoneNumber']('9876543210', 'IN')).toBe('+919876543210');
      expect(service['normalizePhoneNumber']('+919876543210', 'IN')).toBe('+919876543210');
    });

    it('should handle US numbers', () => {
      expect(service['normalizePhoneNumber']('5551234567', 'US')).toBe('+15551234567');
    });
  });

  describe('calculateTrustScore', () => {
    it('should return 50 for equal votes', () => {
      const score = service['calculateTrustScore']({ safeVoteCount: 10, spamVoteCount: 10 } as any);
      expect(score).toBe(50);
    });

    it('should return higher score for more safe votes', () => {
      const score = service['calculateTrustScore']({ safeVoteCount: 20, spamVoteCount: 5 } as any);
      expect(score).toBeGreaterThan(50);
    });

    it('should return lower score for more spam votes', () => {
      const score = service['calculateTrustScore']({ safeVoteCount: 5, spamVoteCount: 20 } as any);
      expect(score).toBeLessThan(50);
    });
  });

  describe('determineTrustLevel', () => {
    it('should return verified for score >= 80', () => {
      expect(service['determineTrustLevel'](80)).toBe('verified');
      expect(service['determineTrustLevel'](95)).toBe('verified');
    });

    it('should return trusted for score >= 60', () => {
      expect(service['determineTrustLevel'](60)).toBe('trusted');
      expect(service['determineTrustLevel'](75)).toBe('trusted');
    });

    it('should return neutral for score >= 40', () => {
      expect(service['determineTrustLevel'](40)).toBe('neutral');
      expect(service['determineTrustLevel'](50)).toBe('neutral');
    });

    it('should return risky for score >= 20', () => {
      expect(service['determineTrustLevel'](20)).toBe('risky');
      expect(service['determineTrustLevel'](35)).toBe('risky');
    });

    it('should return spam for score < 20', () => {
      expect(service['determineTrustLevel'](0)).toBe('spam');
      expect(service['determineTrustLevel'](15)).toBe('spam');
    });
  });
});
