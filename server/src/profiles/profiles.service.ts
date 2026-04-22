import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { profiles, Profile, NewProfile } from '../database/schema';

@Injectable()
export class ProfilesService {
  constructor(@Inject(DATABASE_CONNECTION) private db: any) {}

  async findByUserId(userId: number): Promise<Profile> {
    const [profile] = await this.db.select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    
    return profile;
  }

  async update(userId: number, data: Partial<NewProfile>): Promise<Profile> {
    const [updated] = await this.db.update(profiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    
    return updated;
  }
}
