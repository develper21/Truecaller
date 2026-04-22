import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { spamReports, phoneNumbers, SpamReport, NewSpamReport } from '../database/schema';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { PhoneNumbersService } from '../phone-numbers/phone-numbers.service';

export interface SpamReportWithDetails extends SpamReport {
  phoneNumber?: {
    number: string;
    trustLevel: string;
    spamReportCount: number;
  };
}

export interface SpamStats {
  totalReports: number;
  verifiedReports: number;
  pendingReports: number;
  byCategory: Record<string, number>;
}

@Injectable()
export class SpamReportsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private phoneNumbersService: PhoneNumbersService,
  ) {}

  async createReport(reporterId: number, data: {
    phoneNumber: string;
    category: string;
    reason?: string;
    confidence?: number;
    evidence?: any;
  }) {
    // Find or create the phone number
    const phoneNumber = await this.phoneNumbersService.findOrCreateNumber(data.phoneNumber);

    // Check for recent duplicate reports
    const recentReport = await this.db
      .select()
      .from(spamReports)
      .where(and(
        eq(spamReports.reporterId, reporterId),
        eq(spamReports.phoneNumberId, phoneNumber.id),
        sql`created_at > NOW() - INTERVAL '24 hours'`
      ))
      .limit(1);

    if (recentReport.length > 0) {
      throw new Error('You have already reported this number in the last 24 hours');
    }

    // Get reporter's trust score
    const [reporter] = await this.db.execute(sql`
      SELECT trust_score FROM profiles WHERE user_id = ${reporterId}
    `);
    const reporterTrustScore = reporter?.trust_score || 50;

    // Create the report
    const [report] = await this.db
      .insert(spamReports)
      .values({
        reporterId,
        phoneNumberId: phoneNumber.id,
        category: data.category as any,
        reason: data.reason,
        confidence: data.confidence || 100,
        evidence: data.evidence,
        reporterTrustScore,
        status: 'pending',
      } as NewSpamReport)
      .returning();

    // Increment spam report count
    await this.incrementSpamCount(phoneNumber.id);

    // Update trust score for the number
    await this.updateNumberTrustScore(phoneNumber.id);

    // Clear cache
    await this.redis.del(`spam:stats:${reporterId}`);
    await this.redis.del('trending:spammers');

    return {
      ...report,
      message: 'Report submitted successfully. Thank you for helping keep our community safe!',
    };
  }

  async getReports(
    userId?: number,
    filters?: {
      status?: string;
      category?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    let query = this.db
      .select({
        report: spamReports,
        phoneNumber: {
          number: phoneNumbers.number,
          trustLevel: phoneNumbers.trustLevel,
          spamReportCount: phoneNumbers.spamReportCount,
        },
      })
      .from(spamReports)
      .leftJoin(phoneNumbers, eq(spamReports.phoneNumberId, phoneNumbers.id))
      .orderBy(desc(spamReports.createdAt));

    if (userId) {
      query = query.where(eq(spamReports.reporterId, userId));
    }

    if (filters?.status) {
      query = query.where(eq(spamReports.status, filters.status));
    }

    if (filters?.category) {
      query = query.where(eq(spamReports.category, filters.category as any));
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const results = await query;

    return results.map((r: any) => ({
      ...r.report,
      phoneNumber: r.phoneNumber,
    }));
  }

  async getUserReports(userId: number) {
    return this.getReports(userId);
  }

  async getSpamStats(userId: number): Promise<SpamStats> {
    const cacheKey = `spam:stats:${userId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const [totalResult] = await this.db.execute(sql`
      SELECT COUNT(*) as count FROM spam_reports WHERE reporter_id = ${userId}
    `);

    const [verifiedResult] = await this.db.execute(sql`
      SELECT COUNT(*) as count FROM spam_reports 
      WHERE reporter_id = ${userId} AND status = 'verified'
    `);

    const [pendingResult] = await this.db.execute(sql`
      SELECT COUNT(*) as count FROM spam_reports 
      WHERE reporter_id = ${userId} AND status = 'pending'
    `);

    const [categoryResults] = await this.db.execute(sql`
      SELECT category, COUNT(*) as count 
      FROM spam_reports 
      WHERE reporter_id = ${userId}
      GROUP BY category
    `);

    const byCategory: Record<string, number> = {};
    for (const row of categoryResults || []) {
      byCategory[row.category] = parseInt(row.count);
    }

    const stats: SpamStats = {
      totalReports: parseInt(totalResult?.count || 0),
      verifiedReports: parseInt(verifiedResult?.count || 0),
      pendingReports: parseInt(pendingResult?.count || 0),
      byCategory,
    };

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(stats));

    return stats;
  }

  async verifyReport(reportId: number, reviewerId: number) {
    const [updated] = await this.db
      .update(spamReports)
      .set({
        status: 'verified',
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      })
      .where(eq(spamReports.id, reportId))
      .returning();

    if (updated) {
      // Update reporter's trust score
      await this.rewardReporter(updated.reporterId);
    }

    return updated;
  }

  async rejectReport(reportId: number, reviewerId: number) {
    const [updated] = await this.db
      .update(spamReports)
      .set({
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      })
      .where(eq(spamReports.id, reportId))
      .returning();

    return updated;
  }

  async getTopSpammers(limit: number = 10) {
    const cacheKey = 'top:spammers';
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const results = await this.db.execute(sql`
      SELECT 
        pn.number,
        pn.spam_report_count as reports,
        pn.trust_level,
        COUNT(DISTINCT sr.reporter_id) as unique_reporters,
        MAX(sr.created_at) as last_reported
      FROM phone_numbers pn
      LEFT JOIN spam_reports sr ON pn.id = sr.phone_number_id
      WHERE pn.spam_report_count > 0
      GROUP BY pn.id
      ORDER BY pn.spam_report_count DESC
      LIMIT ${limit}
    `);

    await this.redis.setex(cacheKey, 600, JSON.stringify(results)); // 10 min cache

    return results;
  }

  private async incrementSpamCount(numberId: number) {
    await this.db.execute(sql`
      UPDATE phone_numbers 
      SET 
        spam_report_count = COALESCE(spam_report_count, 0) + 1,
        spam_vote_count = COALESCE(spam_vote_count, 0) + 1,
        updated_at = NOW()
      WHERE id = ${numberId}
    `);
  }

  private async updateNumberTrustScore(numberId: number) {
    // Get vote counts
    const [result] = await this.db.execute(sql`
      SELECT 
        COALESCE(safe_vote_count, 0) as safe,
        COALESCE(spam_vote_count, 0) as spam
      FROM phone_numbers 
      WHERE id = ${numberId}
    `);

    if (result) {
      await this.phoneNumbersService.updateTrustScore(numberId, {
        safe: parseInt(result.safe),
        spam: parseInt(result.spam),
      });
    }
  }

  private async rewardReporter(reporterId: number) {
    // Increase reporter's trust score for accurate reports
    await this.db.execute(sql`
      UPDATE profiles 
      SET trust_score = LEAST(100, trust_score + 2),
          trust_level = CASE 
            WHEN trust_score >= 80 THEN 'verified'
            WHEN trust_score >= 60 THEN 'trusted'
            ELSE trust_level
          END,
          updated_at = NOW()
      WHERE user_id = ${reporterId}
    `);
  }
}
