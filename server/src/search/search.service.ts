import { Injectable, Inject } from '@nestjs/common';
import { eq, ilike, sql, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { phoneNumbers, profiles, searchHistory, PhoneNumber } from '../database/schema';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

export interface SearchResult {
  id: number;
  number: string;
  normalizedNumber?: string;
  carrier?: string;
  trustLevel: string;
  riskScore: string;
  trustScore: number;
  isVerified: boolean;
  isBusiness: boolean;
  businessName?: string;
  location?: string;
  name?: string;
  avatarUrl?: string;
  spamReportCount: number;
  confidence: number;
}

@Injectable()
export class SearchService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async search(query: string, userId?: number, limit: number = 20): Promise<SearchResult[]> {
    if (!query || query.length < 3) {
      return [];
    }

    // Check cache
    const cacheKey = `search:${query}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      const results = JSON.parse(cached);
      if (userId) {
        await this.recordSearch(userId, query, results.length);
      }
      return results;
    }

    // Search phone numbers
    const numberResults = await this.db
      .select({
        id: phoneNumbers.id,
        number: phoneNumbers.number,
        normalizedNumber: phoneNumbers.normalizedNumber,
        carrier: phoneNumbers.carrier,
        trustLevel: phoneNumbers.trustLevel,
        riskScore: phoneNumbers.riskScore,
        trustScore: phoneNumbers.trustScore,
        isVerified: phoneNumbers.isVerified,
        isBusiness: phoneNumbers.isBusiness,
        spamReportCount: phoneNumbers.spamReportCount,
      })
      .from(phoneNumbers)
      .where(ilike(phoneNumbers.number, `%${query}%`))
      .limit(limit);

    // Search profiles by name (if query contains letters)
    let profileResults: any[] = [];
    if (/[a-zA-Z]/.test(query)) {
      profileResults = await this.db.execute(sql`
        SELECT 
          pn.id,
          pn.number,
          p.display_name as name,
          p.location,
          p.avatar_url,
          pn.trust_level,
          pn.risk_score,
          pn.trust_score,
          pn.is_verified,
          pn.is_business,
          pn.business_name,
          pn.spam_report_count
        FROM profiles p
        JOIN users u ON p.user_id = u.id
        JOIN phone_numbers pn ON u.phone_number = pn.number
        WHERE p.display_name ILIKE ${`%${query}%`}
        LIMIT ${limit}
      `);
    }

    // Merge results
    const allResults = [...numberResults, ...profileResults];
    const uniqueResults = this.deduplicateResults(allResults);

    // Calculate confidence and format
    const formattedResults: SearchResult[] = uniqueResults.map((r) => ({
      id: r.id,
      number: r.number,
      normalizedNumber: r.normalizedNumber,
      carrier: r.carrier,
      trustLevel: r.trustLevel || 'neutral',
      riskScore: r.riskScore || 'low',
      trustScore: r.trustScore || 50,
      isVerified: r.isVerified || false,
      isBusiness: r.isBusiness || false,
      businessName: r.businessName,
      location: r.location,
      name: r.name,
      avatarUrl: r.avatarUrl,
      spamReportCount: r.spamReportCount || 0,
      confidence: this.calculateConfidence(r),
    }));

    // Cache for 5 minutes
    await this.redis.setex(cacheKey, 300, JSON.stringify(formattedResults));

    // Record search history
    if (userId) {
      await this.recordSearch(userId, query, formattedResults.length);
    }

    return formattedResults;
  }

  async getSearchHistory(userId: number, limit: number = 20) {
    const results = await this.db
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.userId, userId))
      .orderBy(desc(searchHistory.searchedAt))
      .limit(limit);

    return results;
  }

  async clearSearchHistory(userId: number) {
    await this.db.execute(sql`
      DELETE FROM search_history WHERE user_id = ${userId}
    `);

    return { message: 'Search history cleared' };
  }

  async getTrendingSearches(limit: number = 10) {
    const cacheKey = 'search:trending';
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const results = await this.db.execute(sql`
      SELECT 
        query,
        COUNT(*) as search_count,
        MAX(searched_at) as last_searched
      FROM search_history
      WHERE searched_at > NOW() - INTERVAL '24 hours'
      GROUP BY query
      ORDER BY search_count DESC
      LIMIT ${limit}
    `);

    await this.redis.setex(cacheKey, 300, JSON.stringify(results)); // 5 min cache

    return results;
  }

  private async recordSearch(userId: number, query: string, resultCount: number) {
    await this.db.insert(searchHistory).values({
      userId,
      query,
      resultCount,
      searchedAt: new Date(),
    });
  }

  private deduplicateResults(results: any[]): any[] {
    const seen = new Set();
    return results.filter((r) => {
      if (seen.has(r.number)) {
        return false;
      }
      seen.add(r.number);
      return true;
    });
  }

  private calculateConfidence(result: any): number {
    let confidence = 50;
    
    if (result.isVerified) confidence += 20;
    if (result.name) confidence += 15;
    if (result.location) confidence += 10;
    if (result.carrier) confidence += 5;
    if (result.isBusiness) confidence += 10;
    
    return Math.min(100, confidence);
  }
}
