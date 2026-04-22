import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, ilike, desc, sql, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { 
  phoneNumbers, 
  profiles, 
  spamReports, 
  PhoneNumber,
  NewPhoneNumber,
  users,
} from '../database/schema';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

export interface CallerInfo {
  number: string;
  name?: string;
  location?: string;
  carrier?: string;
  trustLevel: string;
  riskScore: string;
  trustScore: number;
  isVerified: boolean;
  verificationTier?: string;
  isBusiness: boolean;
  businessName?: string;
  spamReportCount: number;
  safeVoteCount: number;
  spamVoteCount: number;
  tags?: string[];
  avatarUrl?: string;
}

@Injectable()
export class PhoneNumbersService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async findOrCreateNumber(number: string, normalizedNumber?: string): Promise<PhoneNumber> {
    // Check cache first
    const cacheKey = `phone:${number}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Try to find existing
    let [phoneNumber] = await this.db
      .select()
      .from(phoneNumbers)
      .where(eq(phoneNumbers.number, number))
      .limit(1);

    if (!phoneNumber && normalizedNumber) {
      [phoneNumber] = await this.db
        .select()
        .from(phoneNumbers)
        .where(eq(phoneNumbers.normalizedNumber, normalizedNumber))
        .limit(1);
    }

    // Create if not found
    if (!phoneNumber) {
      const countryCode = this.extractCountryCode(number);
      const carrier = this.detectCarrier(number);
      
      [phoneNumber] = await this.db
        .insert(phoneNumbers)
        .values({
          number,
          normalizedNumber: normalizedNumber || number,
          countryCode,
          carrier,
          trustLevel: 'neutral',
          riskScore: 'low',
          trustScore: 50,
          lastSearchedAt: new Date(),
        } as NewPhoneNumber)
        .returning();
    } else {
      // Update last searched
      await this.db
        .update(phoneNumbers)
        .set({ lastSearchedAt: new Date() })
        .where(eq(phoneNumbers.id, phoneNumber.id));
    }

    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(phoneNumber));

    return phoneNumber;
  }

  async getCallerInfo(number: string): Promise<CallerInfo> {
    const normalizedNumber = this.normalizeNumber(number);
    const phoneNumber = await this.findOrCreateNumber(number, normalizedNumber);

    // Get associated profile if exists
    const profile = await this.getProfileByNumber(phoneNumber.id);

    // Calculate trust metrics
    const trustScore = this.calculateTrustScore(phoneNumber);
    const riskScore = this.calculateRiskScore(phoneNumber, trustScore);

    return {
      number: phoneNumber.number,
      name: profile?.displayName || profile?.businessName || undefined,
      location: profile?.location || undefined,
      carrier: phoneNumber.carrier || undefined,
      trustLevel: phoneNumber.trustLevel || 'neutral',
      riskScore,
      trustScore,
      isVerified: phoneNumber.isVerified || false,
      verificationTier: phoneNumber.verificationTier || undefined,
      isBusiness: phoneNumber.isBusiness || false,
      businessName: profile?.businessName || undefined,
      spamReportCount: phoneNumber.spamReportCount || 0,
      safeVoteCount: phoneNumber.safeVoteCount || 0,
      spamVoteCount: phoneNumber.spamVoteCount || 0,
      tags: profile?.businessCategory ? [profile.businessCategory] : undefined,
      avatarUrl: profile?.avatarUrl || undefined,
    };
  }

  async lookupNumber(number: string, userId?: number) {
    const callerInfo = await this.getCallerInfo(number);

    // Record search if userId provided
    if (userId) {
      await this.recordSearch(userId, number, callerInfo);
    }

    return {
      ...callerInfo,
      communityVotes: {
        safe: callerInfo.safeVoteCount,
        spam: callerInfo.spamVoteCount,
      },
      confidence: this.calculateConfidence(callerInfo),
    };
  }

  async identifyCaller(
    number: string, 
    userNumber: string,
    deviceInfo?: { deviceId: string; platform: string }
  ) {
    const startTime = Date.now();
    
    // Get caller info
    const callerInfo = await this.getCallerInfo(number);
    
    // Get user's blocked status
    const isBlocked = await this.checkBlockedStatus(userNumber, number);

    // Log the lookup for analytics
    await this.logLookup(number, userNumber, deviceInfo, Date.now() - startTime);

    return {
      caller: callerInfo,
      isBlocked,
      shouldWarn: callerInfo.riskScore === 'high' || callerInfo.riskScore === 'critical',
      action: this.recommendAction(callerInfo, isBlocked),
      timestamp: new Date().toISOString(),
    };
  }

  async updateTrustScore(numberId: number, votes: { safe: number; spam: number }) {
    const phoneNumber = await this.db
      .select()
      .from(phoneNumbers)
      .where(eq(phoneNumbers.id, numberId))
      .limit(1);

    if (!phoneNumber[0]) return;

    const totalVotes = votes.safe + votes.spam;
    const spamRatio = votes.spam / totalVotes;

    let trustLevel: string;
    let riskScore: string;
    let trustScore: number;

    if (spamRatio > 0.7) {
      trustLevel = 'spam';
      riskScore = 'critical';
      trustScore = Math.max(0, 100 - spamRatio * 100);
    } else if (spamRatio > 0.4) {
      trustLevel = 'risky';
      riskScore = 'high';
      trustScore = 50;
    } else if (spamRatio > 0.1) {
      trustLevel = 'neutral';
      riskScore = 'medium';
      trustScore = 70;
    } else {
      trustLevel = 'trusted';
      riskScore = 'low';
      trustScore = 90 + (votes.safe / 100);
    }

    await this.db
      .update(phoneNumbers)
      .set({
        trustLevel,
        riskScore,
        trustScore: Math.min(100, trustScore),
        safeVoteCount: votes.safe,
        spamVoteCount: votes.spam,
        updatedAt: new Date(),
      })
      .where(eq(phoneNumbers.id, numberId));

    // Invalidate cache
    await this.redis.del(`phone:${phoneNumber[0].number}`);
  }

  async getTrendingSpammers(limit: number = 10) {
    const cacheKey = 'trending:spammers';
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const trending = await this.db
      .select({
        id: phoneNumbers.id,
        number: phoneNumbers.number,
        spamCount: phoneNumbers.spamReportCount,
        trustLevel: phoneNumbers.trustLevel,
      })
      .from(phoneNumbers)
      .where(sql`${phoneNumbers.spamReportCount} > 10`)
      .orderBy(desc(phoneNumbers.spamReportCount))
      .limit(limit);

    await this.redis.setex(cacheKey, 300, JSON.stringify(trending)); // 5 min cache

    return trending;
  }

  async searchNumbers(query: string, limit: number = 20) {
    const results = await this.db
      .select({
        id: phoneNumbers.id,
        number: phoneNumbers.number,
        normalizedNumber: phoneNumbers.normalizedNumber,
        carrier: phoneNumbers.carrier,
        trustLevel: phoneNumbers.trustLevel,
        isBusiness: phoneNumbers.isBusiness,
      })
      .from(phoneNumbers)
      .where(
        and(
          ilike(phoneNumbers.number, `%${query}%`),
          sql`LENGTH(${query}) >= 3`
        )
      )
      .limit(limit);

    return results;
  }

  private async getProfileByNumber(phoneNumberId: number) {
    const [profile] = await this.db
      .select({
        displayName: profiles.displayName,
        businessName: profiles.businessName,
        location: profiles.location,
        avatarUrl: profiles.avatarUrl,
        businessCategory: profiles.businessCategory,
        isVerified: profiles.isVerified,
        verificationTier: profiles.verificationTier,
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(users.phoneNumber, sql`(SELECT number FROM phone_numbers WHERE id = ${phoneNumberId})`))
      .limit(1);

    return profile;
  }

  private async checkBlockedStatus(userNumber: string, callerNumber: string): Promise<boolean> {
    const cacheKey = `blocked:${userNumber}:${callerNumber}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return cached === 'true';
    }

    // Query blocked numbers table
    const [blocked] = await this.db.execute(sql`
      SELECT 1 FROM blocked_numbers bn
      JOIN users u ON bn.user_id = u.id
      JOIN phone_numbers pn ON bn.phone_number_id = pn.id
      WHERE u.phone_number = ${userNumber} AND pn.number = ${callerNumber}
      LIMIT 1
    `);

    const isBlocked = !!blocked;
    await this.redis.setex(cacheKey, 300, isBlocked.toString());

    return isBlocked;
  }

  private async recordSearch(userId: number, query: string, result: CallerInfo) {
    await this.db.execute(sql`
      INSERT INTO search_history (user_id, query, result_count, searched_at)
      VALUES (${userId}, ${query}, 1, NOW())
    `);
  }

  private async logLookup(
    number: string, 
    userNumber: string, 
    deviceInfo?: any, 
    responseTime?: number
  ) {
    // Store in Redis for real-time analytics
    const lookupData = {
      number,
      userNumber,
      deviceInfo,
      responseTime,
      timestamp: new Date().toISOString(),
    };

    await this.redis.lpush('lookups:recent', JSON.stringify(lookupData));
    await this.redis.ltrim('lookups:recent', 0, 999); // Keep last 1000

    // Increment counter for stats
    await this.redis.incr('stats:lookups:today');
    await this.redis.expire('stats:lookups:today', 86400);
  }

  private calculateTrustScore(phone: PhoneNumber): number {
    const baseScore = phone.trustScore || 50;
    const totalVotes = (phone.safeVoteCount || 0) + (phone.spamVoteCount || 0);
    
    if (totalVotes === 0) return baseScore;

    const voteRatio = (phone.safeVoteCount || 0) / totalVotes;
    return Math.min(100, Math.max(0, baseScore * 0.5 + voteRatio * 100 * 0.5));
  }

  private calculateRiskScore(phone: PhoneNumber, trustScore: number): string {
    const spamRatio = phone.spamReportCount && phone.spamVoteCount 
      ? phone.spamReportCount / (phone.spamReportCount + (phone.safeVoteCount || 0))
      : 0;

    if (spamRatio > 0.7 || trustScore < 20) return 'critical';
    if (spamRatio > 0.4 || trustScore < 40) return 'high';
    if (spamRatio > 0.1 || trustScore < 60) return 'medium';
    return 'low';
  }

  private calculateConfidence(callerInfo: CallerInfo): number {
    let confidence = 50;
    if (callerInfo.isVerified) confidence += 20;
    if (callerInfo.name) confidence += 15;
    if (callerInfo.location) confidence += 10;
    if (callerInfo.carrier) confidence += 5;
    return Math.min(100, confidence);
  }

  private recommendAction(callerInfo: CallerInfo, isBlocked: boolean): string {
    if (isBlocked) return 'block';
    if (callerInfo.riskScore === 'critical') return 'warn_block';
    if (callerInfo.riskScore === 'high') return 'warn';
    if (callerInfo.isBusiness) return 'allow_business';
    return 'allow';
  }

  private normalizeNumber(number: string): string {
    // Remove all non-numeric characters
    return number.replace(/\D/g, '');
  }

  private extractCountryCode(number: string): string | undefined {
    // Simple extraction - in production, use libphonenumber-js
    if (number.startsWith('+91')) return '+91';
    if (number.startsWith('+1')) return '+1';
    if (number.startsWith('+44')) return '+44';
    return undefined;
  }

  private detectCarrier(number: string): string | undefined {
    // Simplified Indian carrier detection
    const cleaned = number.replace(/\D/g, '');
    if (cleaned.length === 10) {
      const prefix = cleaned.substring(0, 4);
      // Simplified mappings
      if (['9999', '8888', '7777'].some(p => prefix.startsWith(p.substring(0, 2)))) return 'Airtel';
      if (['9876', '8976', '7890'].some(p => prefix.startsWith(p.substring(0, 2)))) return 'Jio';
      if (['9870', '9869', '9810'].some(p => prefix.startsWith(p.substring(0, 2)))) return 'Vi';
    }
    return undefined;
  }
}
