import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { callLogs, phoneNumbers, CallLog, NewCallLog, callTypeEnum } from '../database/schema';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { PhoneNumbersService } from '../phone-numbers/phone-numbers.service';

export interface CallLogWithDetails extends CallLog {
  callerNumber?: {
    number: string;
    trustLevel: string;
    riskScore: string;
    isSpam: boolean;
  };
}

export interface CallStats {
  total: number;
  incoming: number;
  outgoing: number;
  missed: number;
  spam: number;
  blocked: number;
  duration: number; // total seconds
}

@Injectable()
export class CallLogsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private phoneNumbersService: PhoneNumbersService,
  ) {}

  async createCallLog(userId: number, data: {
    callerNumber: string;
    calleeNumber?: string;
    type: 'incoming' | 'outgoing' | 'missed' | 'spam';
    status?: string;
    startedAt?: Date;
    endedAt?: Date;
    duration?: number;
    isSpam?: boolean;
    notes?: string;
  }) {
    // Find or create phone numbers
    const callerNumber = await this.phoneNumbersService.findOrCreateNumber(data.callerNumber);
    let calleeNumberId: number | null = null;
    
    if (data.calleeNumber) {
      const callee = await this.phoneNumbersService.findOrCreateNumber(data.calleeNumber);
      calleeNumberId = callee.id;
    }

    const [log] = await this.db
      .insert(callLogs)
      .values({
        userId,
        callerNumberId: callerNumber.id,
        calleeNumberId,
        type: data.type,
        status: data.status || 'completed',
        startedAt: data.startedAt || new Date(),
        endedAt: data.endedAt,
        duration: data.duration || 0,
        isSpam: data.isSpam || false,
        notes: data.notes,
      } as NewCallLog)
      .returning();

    // Update phone number stats
    await this.updateNumberStats(callerNumber.id, data.type, data.duration || 0);

    // Invalidate user's call stats cache
    await this.redis.del(`stats:calls:${userId}`);

    return log;
  }

  async getCallLogs(
    userId: number,
    filters?: {
      type?: string;
      isSpam?: boolean;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    let query = this.db
      .select({
        log: callLogs,
        callerNumber: {
          number: phoneNumbers.number,
          trustLevel: phoneNumbers.trustLevel,
          riskScore: phoneNumbers.riskScore,
          isSpam: sql<boolean>`${phoneNumbers.trustLevel} = 'spam'`,
        },
      })
      .from(callLogs)
      .leftJoin(phoneNumbers, eq(callLogs.callerNumberId, phoneNumbers.id))
      .where(eq(callLogs.userId, userId))
      .orderBy(desc(callLogs.startedAt));

    if (filters?.type) {
      query = query.where(eq(callLogs.type, filters.type as typeof callTypeEnum.enumValues[number]));
    }

    if (filters?.isSpam !== undefined) {
      query = query.where(eq(callLogs.isSpam, filters.isSpam));
    }

    if (filters?.fromDate) {
      query = query.where(gte(callLogs.startedAt, filters.fromDate));
    }

    if (filters?.toDate) {
      query = query.where(lte(callLogs.startedAt, filters.toDate));
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    const results = await query;

    return results.map((r: any) => ({
      ...r.log,
      callerNumber: r.callerNumber,
    }));
  }

  async getCallLogById(userId: number, logId: number) {
    const [result] = await this.db
      .select({
        log: callLogs,
        callerNumber: {
          number: phoneNumbers.number,
          trustLevel: phoneNumbers.trustLevel,
          riskScore: phoneNumbers.riskScore,
        },
        calleeNumber: {
          number: phoneNumbers.number,
        },
      })
      .from(callLogs)
      .leftJoin(phoneNumbers, eq(callLogs.callerNumberId, phoneNumbers.id))
      .where(and(
        eq(callLogs.id, logId),
        eq(callLogs.userId, userId)
      ))
      .limit(1);

    if (!result) {
      throw new Error('Call log not found');
    }

    return {
      ...result.log,
      callerNumber: result.callerNumber,
    };
  }

  async getCallStats(userId: number, days: number = 30): Promise<CallStats> {
    const cacheKey = `stats:calls:${userId}:${days}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const [stats] = await this.db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN type = 'incoming' THEN 1 END) as incoming,
        COUNT(CASE WHEN type = 'outgoing' THEN 1 END) as outgoing,
        COUNT(CASE WHEN type = 'missed' THEN 1 END) as missed,
        COUNT(CASE WHEN is_spam = true THEN 1 END) as spam,
        COUNT(CASE WHEN status = 'blocked' THEN 1 END) as blocked,
        COALESCE(SUM(duration), 0) as duration
      FROM call_logs
      WHERE user_id = ${userId} AND started_at >= ${fromDate}
    `);

    const result: CallStats = {
      total: parseInt(stats.total) || 0,
      incoming: parseInt(stats.incoming) || 0,
      outgoing: parseInt(stats.outgoing) || 0,
      missed: parseInt(stats.missed) || 0,
      spam: parseInt(stats.spam) || 0,
      blocked: parseInt(stats.blocked) || 0,
      duration: parseInt(stats.duration) || 0,
    };

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(result));

    return result;
  }

  async getRecentCalls(userId: number, limit: number = 10) {
    return this.getCallLogs(userId, { limit });
  }

  async getSpamCalls(userId: number, limit: number = 50) {
    return this.getCallLogs(userId, { isSpam: true, limit });
  }

  async updateCallLog(userId: number, logId: number, data: Partial<NewCallLog>) {
    const [updated] = await this.db
      .update(callLogs)
      .set(data)
      .where(and(
        eq(callLogs.id, logId),
        eq(callLogs.userId, userId)
      ))
      .returning();

    return updated;
  }

  async deleteCallLog(userId: number, logId: number) {
    const [deleted] = await this.db
      .delete(callLogs)
      .where(and(
        eq(callLogs.id, logId),
        eq(callLogs.userId, userId)
      ))
      .returning();

    await this.redis.del(`stats:calls:${userId}`);

    return deleted;
  }

  async getCallHistory(number: string, limit: number = 10) {
    // Get all calls with this number
    const results = await this.db.execute(sql`
      SELECT cl.*, pn.number
      FROM call_logs cl
      JOIN phone_numbers pn ON cl.caller_number_id = pn.id
      WHERE pn.number = ${number}
      ORDER BY cl.started_at DESC
      LIMIT ${limit}
    `);

    return results;
  }

  private async updateNumberStats(numberId: number, type: string, duration: number) {
    // Update phone number call statistics
    await this.db.execute(sql`
      UPDATE phone_numbers
      SET 
        total_calls = COALESCE(total_calls, 0) + 1,
        last_searched_at = NOW()
      WHERE id = ${numberId}
    `);
  }
}
