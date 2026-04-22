import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { phoneNumbers, spamReports, callLogs } from '../database/schema';
import { eq, sql, and, desc, count } from 'drizzle-orm';

export interface SpamPredictionResult {
  isSpam: boolean;
  confidence: number;
  riskScore: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
}

export interface NumberFeatures {
  totalCalls: number;
  spamReports: number;
  reportCategories: string[];
  uniqueReporters: number;
  numberAge: number; // days
  burstCallPattern: boolean;
  crossUserReports: boolean;
}

@Injectable()
export class MLService {
  private readonly logger = new Logger(MLService.name);

  // Rule-based model weights (simplified ML)
  private weights = {
    spamReports: 0.35,
    uniqueReporters: 0.25,
    reportCategories: 0.15,
    burstPattern: 0.15,
    numberAge: 0.10,
  };

  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
  ) {}

  async predictSpam(phoneNumber: string): Promise<SpamPredictionResult> {
    // Extract features
    const features = await this.extractFeatures(phoneNumber);

    // Calculate spam score (0-100)
    const score = this.calculateSpamScore(features);

    // Determine risk level
    const riskScore = this.scoreToRiskLevel(score);

    // Determine if spam based on threshold
    const isSpam = score >= 60;

    // Generate explanation factors
    const factors = this.generateFactors(features, score);

    return {
      isSpam,
      confidence: Math.round(score),
      riskScore,
      factors,
    };
  }

  async batchPredict(phoneNumbers: string[]): Promise<Map<string, SpamPredictionResult>> {
    const results = new Map<string, SpamPredictionResult>();

    for (const number of phoneNumbers) {
      const prediction = await this.predictSpam(number);
      results.set(number, prediction);
    }

    return results;
  }

  private async extractFeatures(phoneNumber: string): Promise<NumberFeatures> {
    // Get phone number record
    const [numberRecord] = await this.db
      .select()
      .from(phoneNumbers)
      .where(eq(phoneNumbers.number, phoneNumber))
      .limit(1);

    if (!numberRecord) {
      return {
        totalCalls: 0,
        spamReports: 0,
        reportCategories: [],
        uniqueReporters: 0,
        numberAge: 0,
        burstCallPattern: false,
        crossUserReports: false,
      };
    }

    // Get spam reports
    const reports = await this.db.execute(sql`
      SELECT 
        sr.category,
        sr.reporter_id,
        sr.created_at
      FROM spam_reports sr
      WHERE sr.phone_number_id = ${numberRecord.id}
      ORDER BY sr.created_at DESC
    `);

    // Get call patterns
    const callStats = await this.db.execute(sql`
      SELECT 
        COUNT(*) as total_calls,
        MAX(created_at) as last_call,
        MIN(created_at) as first_call
      FROM call_logs
      WHERE caller_number_id = ${numberRecord.id}
    `);

    // Analyze categories
    const categories = [...new Set(reports?.map((r: any) => r.category) || [])] as string[];

    // Unique reporters
    const uniqueReporterIds = [...new Set(reports?.map((r: any) => r.reporter_id) || [])];

    // Check for burst pattern (many calls in short time)
    const hasBurstPattern = await this.detectBurstPattern(numberRecord.id);

    // Cross-user reports (reported by different users)
    const crossUserReports = uniqueReporterIds.length > 3;

    // Calculate number age
    const numberAge = numberRecord.createdAt
      ? Math.floor((Date.now() - new Date(numberRecord.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      totalCalls: parseInt(callStats?.[0]?.total_calls || 0),
      spamReports: reports?.length || 0,
      reportCategories: categories,
      uniqueReporters: uniqueReporterIds.length,
      numberAge,
      burstCallPattern: hasBurstPattern,
      crossUserReports,
    };
  }

  private calculateSpamScore(features: NumberFeatures): number {
    let score = 0;

    // Spam reports weight (max 35 points)
    score += Math.min(features.spamReports * 7, 35);

    // Unique reporters weight (max 25 points)
    score += Math.min(features.uniqueReporters * 5, 25);

    // Report categories diversity (max 15 points)
    score += Math.min(features.reportCategories.length * 5, 15);

    // Burst pattern (max 15 points)
    if (features.burstCallPattern) score += 15;

    // Number age penalty (new numbers more suspicious, max 10 points)
    if (features.numberAge < 7) {
      score += (7 - features.numberAge);
    }

    // Cross-user reports bonus
    if (features.crossUserReports) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private scoreToRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private generateFactors(features: NumberFeatures, score: number): string[] {
    const factors: string[] = [];

    if (features.spamReports > 0) {
      factors.push(`${features.spamReports} spam reports received`);
    }

    if (features.uniqueReporters > 1) {
      factors.push(`Reported by ${features.uniqueReporters} different users`);
    }

    if (features.burstCallPattern) {
      factors.push('Burst calling pattern detected');
    }

    if (features.reportCategories.includes('fraud')) {
      factors.push('Marked as fraud by users');
    }

    if (features.reportCategories.includes('telemarketer')) {
      factors.push('Marked as telemarketing');
    }

    if (features.numberAge < 7 && features.spamReports > 0) {
      factors.push('New number with spam reports');
    }

    if (features.crossUserReports) {
      factors.push('Cross-user spam pattern');
    }

    if (factors.length === 0) {
      if (score < 30) {
        factors.push('No suspicious activity detected');
      } else {
        factors.push('Low confidence prediction');
      }
    }

    return factors;
  }

  private async detectBurstPattern(numberId: number): Promise<boolean> {
    // Check for high frequency calls in 1-hour window
    const result = await this.db.execute(sql`
      SELECT COUNT(*) as count
      FROM call_logs
      WHERE caller_number_id = ${numberId}
        AND created_at > NOW() - INTERVAL '1 hour'
    `);

    return parseInt(result?.[0]?.count || 0) > 10;
  }

  // Model training endpoint (placeholder for future ML model)
  async trainModel(): Promise<{ accuracy: number; samples: number }> {
    // In a real implementation, this would:
    // 1. Load historical data
    // 2. Train a model (scikit-learn, TensorFlow, etc.)
    // 3. Validate accuracy
    // 4. Save model weights

    return {
      accuracy: 0.85,
      samples: 10000,
    };
  }

  async getModelStats(): Promise<any> {
    const stats = await this.db.execute(sql`
      SELECT 
        COUNT(*) as total_predictions,
        AVG(CASE WHEN is_spam = true THEN 1 ELSE 0 END) as spam_rate,
        COUNT(DISTINCT phone_number_id) as unique_numbers
      FROM spam_reports
    `);

    return {
      predictions: parseInt(stats?.[0]?.total_predictions || 0),
      spamRate: parseFloat(stats?.[0]?.spam_rate || 0),
      uniqueNumbers: parseInt(stats?.[0]?.unique_numbers || 0),
      modelVersion: '1.0.0-rule-based',
      lastTrained: new Date(),
    };
  }
}
