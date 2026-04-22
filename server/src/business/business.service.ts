import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { businessAccounts, phoneNumbers, BusinessAccount, NewBusinessAccount } from '../database/schema';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class BusinessService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async createBusinessAccount(userId: number, data: Omit<NewBusinessAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
    // Check if user already has a business account
    const [existing] = await this.db
      .select()
      .from(businessAccounts)
      .where(eq(businessAccounts.userId, userId))
      .limit(1);

    if (existing) {
      throw new Error('User already has a business account');
    }

    // Create phone number reference if provided
    let phoneNumberId: number | null = null;
    if (data.phoneNumberId) {
      phoneNumberId = data.phoneNumberId;
    }

    const [account] = await this.db
      .insert(businessAccounts)
      .values({
        ...data,
        userId,
        phoneNumberId,
        verificationStatus: 'pending',
        status: 'active',
      } as NewBusinessAccount)
      .returning();

    // Update phone number to mark as business
    if (phoneNumberId) {
      await this.db.execute(sql`
        UPDATE phone_numbers 
        SET is_business = true, business_name = ${data.companyName}
        WHERE id = ${phoneNumberId}
      `);
    }

    await this.redis.del(`business:${userId}`);

    return account;
  }

  async getBusinessAccountById(id: number) {
    const [account] = await this.db
      .select()
      .from(businessAccounts)
      .where(eq(businessAccounts.id, id))
      .limit(1);

    if (!account) {
      throw new NotFoundException('Business account not found');
    }

    return account;
  }

  async getBusinessAccountByUserId(userId: number) {
    const cacheKey = `business:${userId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const [account] = await this.db
      .select({
        account: businessAccounts,
        phoneNumber: {
          number: phoneNumbers.number,
        },
      })
      .from(businessAccounts)
      .leftJoin(phoneNumbers, eq(businessAccounts.phoneNumberId, phoneNumbers.id))
      .where(eq(businessAccounts.userId, userId))
      .limit(1);

    if (!account) {
      return null;
    }

    const result = {
      ...account.account,
      phoneNumber: account.phoneNumber,
    };

    await this.redis.setex(cacheKey, 300, JSON.stringify(result));

    return result;
  }

  async updateBusinessAccount(userId: number, data: Partial<NewBusinessAccount>) {
    const [existing] = await this.db
      .select()
      .from(businessAccounts)
      .where(eq(businessAccounts.userId, userId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Business account not found');
    }

    const [updated] = await this.db
      .update(businessAccounts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(businessAccounts.userId, userId))
      .returning();

    await this.redis.del(`business:${userId}`);

    return updated;
  }

  async getVerifiedBusinesses(category?: string, limit: number = 20) {
    let query = this.db
      .select()
      .from(businessAccounts)
      .where(and(
        eq(businessAccounts.isVerified, true),
        eq(businessAccounts.status, 'active')
      ))
      .orderBy(desc(businessAccounts.customerRating))
      .limit(limit);

    if (category) {
      query = query.where(eq(businessAccounts.category, category));
    }

    return query;
  }

  async getBusinessCategories() {
    const results = await this.db.execute(sql`
      SELECT category, COUNT(*) as count
      FROM business_accounts
      WHERE is_verified = true AND status = 'active'
      GROUP BY category
      ORDER BY count DESC
    `);

    return results;
  }

  async submitVerification(userId: number, documents: Array<{ type: string; url: string }>) {
    const [existing] = await this.db
      .select()
      .from(businessAccounts)
      .where(eq(businessAccounts.userId, userId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Business account not found');
    }

    const [updated] = await this.db
      .update(businessAccounts)
      .set({
        verificationStatus: 'pending',
        verificationDocuments: documents.map(d => ({ ...d, verified: false })),
        updatedAt: new Date(),
      })
      .where(eq(businessAccounts.userId, userId))
      .returning();

    return updated;
  }

  async verifyBusinessAccount(businessId: number, reviewerId: number) {
    const [updated] = await this.db
      .update(businessAccounts)
      .set({
        isVerified: true,
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: reviewerId,
        updatedAt: new Date(),
      })
      .where(eq(businessAccounts.id, businessId))
      .returning();

    return updated;
  }

  async updateStats(businessId: number, rating?: number) {
    const updates: any = {
      totalCalls: sql`total_calls + 1`,
    };

    if (rating) {
      updates.reviewCount = sql`review_count + 1`;
      updates.customerRating = sql`(
        (COALESCE(customer_rating, 0) * review_count + ${rating}) / (review_count + 1)
      )`;
    }

    await this.db
      .update(businessAccounts)
      .set(updates)
      .where(eq(businessAccounts.id, businessId));
  }
}
