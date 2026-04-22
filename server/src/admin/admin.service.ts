import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import {
  users,
  profiles,
  phoneNumbers,
  spamReports,
  businessAccounts,
  auditLogs,
  callLogs,
} from '../database/schema';

export interface DashboardStats {
  totalUsers: number;
  totalCalls: number;
  totalReports: number;
  pendingVerifications: number;
  activeBusinesses: number;
  spamNumbers: number;
}

export interface VerificationQueueItem {
  id: number;
  type: 'business' | 'user';
  entityId: number;
  companyName?: string;
  displayName?: string;
  submittedAt: Date;
  documents: any[];
}

export interface ReportReviewItem {
  reportId: number;
  phoneNumber: string;
  category: string;
  reason: string;
  reporterTrustScore: number;
  submittedAt: Date;
}

@Injectable()
export class AdminService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const [userCount] = await this.db.execute(sql`SELECT COUNT(*) as count FROM users`);
    const [callCount] = await this.db.execute(sql`SELECT COUNT(*) as count FROM call_logs`);
    const [reportCount] = await this.db.execute(sql`SELECT COUNT(*) as count FROM spam_reports`);
    const [pendingBiz] = await this.db.execute(
      sql`SELECT COUNT(*) as count FROM business_accounts WHERE verification_status = 'pending'`
    );
    const [activeBiz] = await this.db.execute(
      sql`SELECT COUNT(*) as count FROM business_accounts WHERE status = 'active' AND is_verified = true`
    );
    const [spamNumbers] = await this.db.execute(
      sql`SELECT COUNT(*) as count FROM phone_numbers WHERE trust_level = 'spam'`
    );

    return {
      totalUsers: parseInt(userCount?.count || 0),
      totalCalls: parseInt(callCount?.count || 0),
      totalReports: parseInt(reportCount?.count || 0),
      pendingVerifications: parseInt(pendingBiz?.count || 0),
      activeBusinesses: parseInt(activeBiz?.count || 0),
      spamNumbers: parseInt(spamNumbers?.count || 0),
    };
  }

  async getVerificationQueue(): Promise<VerificationQueueItem[]> {
    // Get pending business verifications
    const businesses = await this.db.execute(sql`
      SELECT 
        ba.id,
        'business' as type,
        ba.id as entity_id,
        ba.company_name as company_name,
        NULL as display_name,
        ba.created_at as submitted_at,
        ba.verification_documents as documents
      FROM business_accounts ba
      WHERE ba.verification_status = 'pending'
      ORDER BY ba.created_at DESC
    `);

    return businesses.map((b: any) => ({
      id: b.id,
      type: b.type,
      entityId: b.entity_id,
      companyName: b.company_name,
      displayName: b.display_name,
      submittedAt: b.submitted_at,
      documents: b.documents || [],
    }));
  }

  async getPendingReports(): Promise<ReportReviewItem[]> {
    const reports = await this.db.execute(sql`
      SELECT 
        sr.id as report_id,
        pn.number as phone_number,
        sr.category,
        sr.reason,
        sr.reporter_trust_score,
        sr.created_at as submitted_at
      FROM spam_reports sr
      JOIN phone_numbers pn ON sr.phone_number_id = pn.id
      WHERE sr.status = 'pending'
      ORDER BY sr.reporter_trust_score DESC, sr.created_at DESC
      LIMIT 50
    `);

    return reports.map((r: any) => ({
      reportId: r.report_id,
      phoneNumber: r.phone_number,
      category: r.category,
      reason: r.reason,
      reporterTrustScore: r.reporter_trust_score,
      submittedAt: r.submitted_at,
    }));
  }

  async getAuditLogs(filters?: {
    userId?: number;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
  }) {
    let query = sql`
      SELECT 
        al.*,
        u.phone_number as user_phone
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;

    if (filters?.userId) {
      query = sql`${query} AND al.user_id = ${filters.userId}`;
    }

    if (filters?.action) {
      query = sql`${query} AND al.action = ${filters.action}`;
    }

    if (filters?.fromDate) {
      query = sql`${query} AND al.created_at >= ${filters.fromDate}`;
    }

    if (filters?.toDate) {
      query = sql`${query} AND al.created_at <= ${filters.toDate}`;
    }

    query = sql`${query} ORDER BY al.created_at DESC LIMIT ${filters?.limit || 100}`;

    return this.db.execute(query);
  }

  async getUserDetails(userId: number) {
    const [user] = await this.db.execute(sql`
      SELECT 
        u.*,
        p.display_name,
        p.trust_score,
        p.trust_level,
        p.is_verified,
        p.business_name,
        pn.number as phone_number
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN phone_numbers pn ON u.phone_number = pn.number
      WHERE u.id = ${userId}
    `);

    if (!user) {
      return null;
    }

    // Get user's activity stats
    const [callStats] = await this.db.execute(sql`
      SELECT 
        COUNT(*) as total_calls,
        COUNT(CASE WHEN is_spam = true THEN 1 END) as spam_calls
      FROM call_logs
      WHERE user_id = ${userId}
    `);

    const [reportStats] = await this.db.execute(sql`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_reports
      FROM spam_reports
      WHERE reporter_id = ${userId}
    `);

    return {
      ...user,
      stats: {
        totalCalls: parseInt(callStats?.total_calls || 0),
        spamCalls: parseInt(callStats?.spam_calls || 0),
        totalReports: parseInt(reportStats?.total_reports || 0),
        verifiedReports: parseInt(reportStats?.verified_reports || 0),
      },
    };
  }

  async moderateUser(userId: number, action: 'suspend' | 'ban' | 'restore', reason: string, adminId: number) {
    const status = action === 'restore' ? 'active' : action === 'ban' ? 'banned' : 'suspended';

    await this.db.execute(sql`
      UPDATE users 
      SET is_active = ${status === 'active'}, status = ${status}
      WHERE id = ${userId}
    `);

    // Log the action
    await this.db.execute(sql`
      INSERT INTO audit_logs (user_id, action, entity, entity_id, details, created_at)
      VALUES (
        ${adminId}, 
        'user_moderation', 
        'user', 
        ${userId}, 
        ${JSON.stringify({ action, reason })},
        NOW()
      )
    `);

    return { message: `User ${action}ed successfully` };
  }

  async getTopSpammers(limit: number = 100) {
    return this.db.execute(sql`
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
  }

  async getSystemHealth() {
    // Database connection check
    const dbHealth = await this.db.execute(sql`SELECT 1 as healthy`).then(() => true).catch(() => false);

    // Table row counts
    const tableCounts = await this.db.execute(sql`
      SELECT 
        'users' as table_name, COUNT(*) as row_count FROM users
      UNION ALL
      SELECT 'phone_numbers', COUNT(*) FROM phone_numbers
      UNION ALL
      SELECT 'call_logs', COUNT(*) FROM call_logs
      UNION ALL
      SELECT 'spam_reports', COUNT(*) FROM spam_reports
    `);

    return {
      database: dbHealth ? 'healthy' : 'unhealthy',
      tables: tableCounts,
      timestamp: new Date(),
    };
  }
}
