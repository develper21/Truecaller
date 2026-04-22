import { Injectable, Inject } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { phoneNumbers, callLogs, profiles, businessAccounts, spamReports, users } from '../database/schema';

export interface CallerInfo {
  name?: string;
  businessName?: string;
  trustLevel: string;
  location?: string;
  avatar?: string;
  category?: string;
}

export interface CallLogData {
  callId: string;
  callerNumberId: number;
  calleeUserId: number;
  status: 'started' | 'accepted' | 'rejected' | 'ended';
  startedAt: Date;
}

@Injectable()
export class CallOverlayService {
  private activeCalls: Map<string, CallLogData> = new Map();

  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
  ) {}

  async getCallerInfo(callerNumber: string, calleeNumber: string): Promise<CallerInfo> {
    // Find caller in database
    const [phoneRecord] = await this.db
      .select()
      .from(phoneNumbers)
      .where(eq(phoneNumbers.number, callerNumber))
      .limit(1);

    if (!phoneRecord) {
      return {
        trustLevel: 'neutral',
      };
    }

    // Get profile info if available (join through users table since profiles has userId not phoneNumberId)
    const [profile] = await this.db
      .select({
        displayName: profiles.displayName,
        location: profiles.location,
        avatarUrl: profiles.avatarUrl,
        businessCategory: profiles.businessCategory,
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(users.phoneNumber, phoneRecord.number))
      .limit(1);

    // Check if it's a business
    const [business] = await this.db
      .select()
      .from(businessAccounts)
      .where(eq(businessAccounts.phoneNumberId, phoneRecord.id))
      .limit(1);

    return {
      name: profile?.displayName,
      businessName: business?.companyName,
      trustLevel: phoneRecord.trustLevel || 'neutral',
      location: profile?.location || phoneRecord.country,
      avatar: profile?.avatarUrl,
      category: business?.category,
    };
  }

  async logCallStart(callId: string, data: { callerNumber: string; calleeNumber: string }): Promise<void> {
    // Get phone number IDs
    const [callerPhone] = await this.db
      .select()
      .from(phoneNumbers)
      .where(eq(phoneNumbers.number, data.callerNumber))
      .limit(1);

    const [calleePhone] = await this.db
      .select()
      .from(phoneNumbers)
      .where(eq(phoneNumbers.number, data.calleeNumber))
      .limit(1);

    const callerNumberId = callerPhone?.id;
    const calleeNumberId = calleePhone?.id;

    // Get callee user ID
    let calleeUserId: number | null = null;
    if (calleePhone) {
      const [calleeUser] = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.phoneNumber, calleePhone.number))
        .limit(1);
      calleeUserId = calleeUser?.id || null;
    }

    // Store active call
    this.activeCalls.set(callId, {
      callId,
      callerNumberId: callerNumberId || 0,
      calleeUserId: calleeUserId || 0,
      status: 'started',
      startedAt: new Date(),
    });

    // Log to database
    await this.db.insert(callLogs).values({
      userId: calleeUserId,
      callerNumberId: callerNumberId,
      receiverNumberId: calleeNumberId,
      direction: 'incoming',
      status: 'started',
      startedAt: new Date(),
    });
  }

  async updateCallStatus(callId: string, status: 'accepted' | 'rejected', reason?: string): Promise<void> {
    const callData = this.activeCalls.get(callId);
    if (!callData) return;

    callData.status = status;

    // Update database
    await this.db.execute(`
      UPDATE call_logs 
      SET status = $1, ${reason ? `notes = '${reason}',` : ''} updated_at = NOW()
      WHERE user_id = $2 AND caller_number_id = $3 AND status = 'started'
      ORDER BY created_at DESC
      LIMIT 1
    `, [status, callData.calleeUserId, callData.callerNumberId]);
  }

  async logCallEnd(callId: string, data: { duration: number; isSpam?: boolean; userId: number }): Promise<void> {
    const callData = this.activeCalls.get(callId);

    // Update call log with duration
    await this.db.execute(`
      UPDATE call_logs 
      SET 
        status = 'ended',
        duration = $1,
        is_spam = $2,
        ended_at = NOW(),
        updated_at = NOW()
      WHERE user_id = $3 
        AND (status = 'started' OR status = 'accepted')
      ORDER BY created_at DESC
      LIMIT 1
    `, [data.duration, data.isSpam || false, data.userId]);

    // Remove from active calls
    this.activeCalls.delete(callId);

    // Update phone number stats if spam
    if (data.isSpam && callData?.callerNumberId) {
      await this.db.execute(`
        UPDATE phone_numbers 
        SET spam_report_count = spam_report_count + 1, updated_at = NOW()
        WHERE id = $1
      `, [callData.callerNumberId]);
    }
  }

  async reportSpamFromCall(callId: string, reporterId: number, category: string, reason: string): Promise<void> {
    const callData = this.activeCalls.get(callId);
    if (!callData || !callData.callerNumberId) {
      throw new Error('Call not found or caller unknown');
    }

    // Create spam report
    await this.db.insert(spamReports).values({
      phoneNumberId: callData.callerNumberId,
      reporterId: reporterId,
      category: category,
      reason: reason,
      status: 'pending',
    });

    // Update phone number spam count
    await this.db.execute(`
      UPDATE phone_numbers 
      SET 
        spam_report_count = spam_report_count + 1,
        risk_score = LEAST(100, risk_score + 10),
        updated_at = NOW()
      WHERE id = $1
    `, [callData.callerNumberId]);
  }

  getActiveCalls(): Map<string, CallLogData> {
    return this.activeCalls;
  }
}
