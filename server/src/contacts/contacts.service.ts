import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { contacts, phoneNumbers, Contact, NewContact } from '../database/schema';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { PhoneNumbersService } from '../phone-numbers/phone-numbers.service';

export interface ContactWithNumber {
  id: number;
  userId: number;
  phoneNumberId: number;
  name: string;
  isFavorite: boolean;
  isBlocked: boolean;
  tags?: string[];
  syncStatus: string;
  createdAt: Date;
  updatedAt: Date;
  phoneNumber?: {
    number: string;
    trustLevel: string;
    isSpam: boolean;
  };
}

export interface SyncResult {
  added: number;
  updated: number;
  deleted: number;
  failed: number;
}

@Injectable()
export class ContactsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private phoneNumbersService: PhoneNumbersService,
  ) {}

  async getContacts(userId: number, filters?: { isFavorite?: boolean; isBlocked?: boolean }) {
    let query = this.db
      .select({
        contact: contacts,
        phoneNumber: {
          number: phoneNumbers.number,
          trustLevel: phoneNumbers.trustLevel,
          isSpam: sql<boolean>`${phoneNumbers.trustLevel} = 'spam'`,
        },
      })
      .from(contacts)
      .leftJoin(phoneNumbers, eq(contacts.phoneNumberId, phoneNumbers.id))
      .where(eq(contacts.userId, userId));

    if (filters?.isFavorite !== undefined) {
      query = query.where(eq(contacts.isFavorite, filters.isFavorite));
    }

    if (filters?.isBlocked !== undefined) {
      query = query.where(eq(contacts.isBlocked, filters.isBlocked));
    }

    const results = await query;

    return results.map((r: any) => ({
      ...r.contact,
      phoneNumber: r.phoneNumber,
    }));
  }

  async getContactById(userId: number, contactId: number) {
    const [result] = await this.db
      .select({
        contact: contacts,
        phoneNumber: {
          number: phoneNumbers.number,
          trustLevel: phoneNumbers.trustLevel,
          riskScore: phoneNumbers.riskScore,
          isVerified: phoneNumbers.isVerified,
        },
      })
      .from(contacts)
      .leftJoin(phoneNumbers, eq(contacts.phoneNumberId, phoneNumbers.id))
      .where(and(
        eq(contacts.id, contactId),
        eq(contacts.userId, userId)
      ))
      .limit(1);

    if (!result) {
      throw new NotFoundException('Contact not found');
    }

    return {
      ...result.contact,
      phoneNumber: result.phoneNumber,
    };
  }

  async createContact(userId: number, data: {
    name: string;
    phoneNumber: string;
    isFavorite?: boolean;
    tags?: string[];
  }) {
    // Find or create phone number
    const phoneNumber = await this.phoneNumbersService.findOrCreateNumber(data.phoneNumber);

    // Check if contact already exists
    const [existing] = await this.db
      .select()
      .from(contacts)
      .where(and(
        eq(contacts.userId, userId),
        eq(contacts.phoneNumberId, phoneNumber.id)
      ))
      .limit(1);

    if (existing) {
      throw new Error('Contact already exists');
    }

    const [contact] = await this.db
      .insert(contacts)
      .values({
        userId,
        phoneNumberId: phoneNumber.id,
        name: data.name,
        isFavorite: data.isFavorite || false,
        tags: data.tags || [],
        syncStatus: 'synced',
      } as NewContact)
      .returning();

    // Invalidate cache
    await this.invalidateContactsCache(userId);

    return contact;
  }

  async updateContact(userId: number, contactId: number, data: Partial<NewContact>) {
    const [updated] = await this.db
      .update(contacts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(contacts.id, contactId),
        eq(contacts.userId, userId)
      ))
      .returning();

    if (!updated) {
      throw new NotFoundException('Contact not found');
    }

    await this.invalidateContactsCache(userId);

    return updated;
  }

  async deleteContact(userId: number, contactId: number) {
    const [deleted] = await this.db
      .delete(contacts)
      .where(and(
        eq(contacts.id, contactId),
        eq(contacts.userId, userId)
      ))
      .returning();

    if (!deleted) {
      throw new NotFoundException('Contact not found');
    }

    await this.invalidateContactsCache(userId);

    return { message: 'Contact deleted' };
  }

  async syncContacts(userId: number, deviceContacts: Array<{
    name: string;
    phoneNumber: string;
    isFavorite?: boolean;
  }>): Promise<SyncResult> {
    const result: SyncResult = { added: 0, updated: 0, deleted: 0, failed: 0 };

    // Get existing contacts
    const existingContacts = await this.getContacts(userId);
    const existingMap = new Map(existingContacts.map(c => [c.phoneNumber?.number, c]));

    for (const deviceContact of deviceContacts) {
      try {
        const existing = existingMap.get(deviceContact.phoneNumber);

        if (existing) {
          // Update if changed
          const existingContact = existing as ContactWithNumber;
          if (existingContact.name !== deviceContact.name || 
              existingContact.isFavorite !== (deviceContact.isFavorite || false)) {
            await this.updateContact(userId, existingContact.id, {
              name: deviceContact.name,
              isFavorite: deviceContact.isFavorite || false,
            });
            result.updated++;
          }
        } else {
          // Create new
          await this.createContact(userId, {
            name: deviceContact.name,
            phoneNumber: deviceContact.phoneNumber,
            isFavorite: deviceContact.isFavorite,
          });
          result.added++;
        }
      } catch (error) {
        result.failed++;
        console.error('Sync error:', error);
      }
    }

    // Mark contacts not in device as pending (soft delete)
    const deviceNumbers = new Set(deviceContacts.map(c => c.phoneNumber));
    for (const existing of existingContacts) {
      if (!deviceNumbers.has(existing.phoneNumber?.number || '')) {
        await this.updateContact(userId, existing.id, { syncStatus: 'pending' });
        result.deleted++;
      }
    }

    await this.invalidateContactsCache(userId);

    return result;
  }

  async toggleFavorite(userId: number, contactId: number) {
    const contact = await this.getContactById(userId, contactId);
    
    return this.updateContact(userId, contactId, {
      isFavorite: !contact.isFavorite,
    });
  }

  async blockContact(userId: number, contactId: number) {
    return this.updateContact(userId, contactId, {
      isBlocked: true,
    });
  }

  async unblockContact(userId: number, contactId: number) {
    return this.updateContact(userId, contactId, {
      isBlocked: false,
    });
  }

  async getFavorites(userId: number) {
    return this.getContacts(userId, { isFavorite: true });
  }

  async getBlocked(userId: number) {
    return this.getContacts(userId, { isBlocked: true });
  }

  private async invalidateContactsCache(userId: number) {
    await this.redis.del(`contacts:${userId}`);
    await this.redis.del(`contacts:${userId}:favorites`);
    await this.redis.del(`contacts:${userId}:blocked`);
  }
}
