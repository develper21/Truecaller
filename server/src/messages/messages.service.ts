import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { threads, messages, phoneNumbers, Message, NewMessage, Thread, NewThread } from '../database/schema';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class MessagesService {
  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  // Threads
  async createThread(userId: number, data: {
    participantId?: number;
    participantNumber?: string;
    businessAccountId?: number;
    type?: string;
    subject?: string;
  }) {
    let participantNumberId: number | null = null;

    // If participantNumber provided, find or create phone number
    if (data.participantNumber) {
      const [phone] = await this.db
        .select()
        .from(phoneNumbers)
        .where(eq(phoneNumbers.number, data.participantNumber))
        .limit(1);

      if (phone) {
        participantNumberId = phone.id;
      }
    }

    const [thread] = await this.db
      .insert(threads)
      .values({
        userId,
        participantId: data.participantId,
        participantNumberId,
        businessAccountId: data.businessAccountId,
        type: data.type || 'direct',
        subject: data.subject,
      } as NewThread)
      .returning();

    return thread;
  }

  async getThreads(userId: number, filters?: { archived?: boolean; pinned?: boolean }) {
    let query = this.db
      .select({
        thread: threads,
        participantNumber: {
          number: phoneNumbers.number,
        },
      })
      .from(threads)
      .leftJoin(phoneNumbers, eq(threads.participantNumberId, phoneNumbers.id))
      .where(and(
        eq(threads.userId, userId),
        eq(threads.isDeleted, false)
      ))
      .orderBy(desc(threads.lastMessageAt));

    if (filters?.archived !== undefined) {
      query = query.where(eq(threads.isArchived, filters.archived));
    }

    if (filters?.pinned !== undefined) {
      query = query.where(eq(threads.isPinned, filters.pinned));
    }

    const results = await query;

    return results.map((r: any) => ({
      ...r.thread,
      participantNumber: r.participantNumber,
    }));
  }

  async getThreadById(threadId: number, userId: number) {
    const [result] = await this.db
      .select({
        thread: threads,
        participantNumber: {
          number: phoneNumbers.number,
        },
      })
      .from(threads)
      .leftJoin(phoneNumbers, eq(threads.participantNumberId, phoneNumbers.id))
      .where(and(
        eq(threads.id, threadId),
        eq(threads.userId, userId)
      ))
      .limit(1);

    if (!result) {
      throw new NotFoundException('Thread not found');
    }

    return {
      ...result.thread,
      participantNumber: result.participantNumber,
    };
  }

  async updateThread(userId: number, threadId: number, data: Partial<NewThread>) {
    const [updated] = await this.db
      .update(threads)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(threads.id, threadId),
        eq(threads.userId, userId)
      ))
      .returning();

    if (!updated) {
      throw new NotFoundException('Thread not found');
    }

    return updated;
  }

  // Messages
  async sendMessage(threadId: number, senderId: number, data: {
    content: string;
    type?: string;
    mediaUrl?: string;
    mediaType?: string;
    replyToId?: number;
    isAutoReply?: boolean;
  }) {
    // Verify thread exists and user is participant
    const [thread] = await this.db
      .select()
      .from(threads)
      .where(and(
        eq(threads.id, threadId),
        eq(threads.userId, senderId)
      ))
      .limit(1);

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Create message
    const [message] = await this.db
      .insert(messages)
      .values({
        threadId,
        senderId,
        type: data.type || 'text',
        content: data.content,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        replyToId: data.replyToId,
        isAutoReply: data.isAutoReply || false,
        status: 'sent',
      } as NewMessage)
      .returning();

    // Update thread with last message info
    await this.db
      .update(threads)
      .set({
        lastMessageAt: new Date(),
        lastMessagePreview: data.content.substring(0, 200),
        lastMessageId: message.id,
        unreadCount: sql`unread_count + 1`,
        updatedAt: new Date(),
      })
      .where(eq(threads.id, threadId));

    return message;
  }

  async getMessages(threadId: number, userId: number, options?: { limit?: number; before?: Date }) {
    // Verify thread access
    const [thread] = await this.db
      .select()
      .from(threads)
      .where(and(
        eq(threads.id, threadId),
        eq(threads.userId, userId)
      ))
      .limit(1);

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    let query = this.db
      .select()
      .from(messages)
      .where(and(
        eq(messages.threadId, threadId),
        eq(messages.isDeleted, false)
      ))
      .orderBy(desc(messages.sentAt));

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.before) {
      query = query.where(sql`${messages.sentAt} < ${options.before}`);
    }

    return query;
  }

  async markAsRead(threadId: number, userId: number) {
    // Mark all messages as read
    await this.db
      .update(messages)
      .set({
        status: 'read',
        readAt: new Date(),
      })
      .where(and(
        eq(messages.threadId, threadId),
        eq(messages.status, 'delivered')
      ));

    // Reset unread count
    await this.db
      .update(threads)
      .set({ unreadCount: 0 })
      .where(and(
        eq(threads.id, threadId),
        eq(threads.userId, userId)
      ));

    return { message: 'Marked as read' };
  }

  async editMessage(messageId: number, userId: number, newContent: string) {
    const [message] = await this.db
      .select()
      .from(messages)
      .where(and(
        eq(messages.id, messageId),
        eq(messages.senderId, userId)
      ))
      .limit(1);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const [updated] = await this.db
      .update(messages)
      .set({
        content: newContent,
        isEdited: true,
        editedAt: new Date(),
        originalContent: message.content,
      })
      .where(eq(messages.id, messageId))
      .returning();

    return updated;
  }

  async deleteMessage(messageId: number, userId: number) {
    const [message] = await this.db
      .select()
      .from(messages)
      .where(and(
        eq(messages.id, messageId),
        eq(messages.senderId, userId)
      ))
      .limit(1);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const [updated] = await this.db
      .update(messages)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        content: null,
      })
      .where(eq(messages.id, messageId))
      .returning();

    return updated;
  }

  async addReaction(messageId: number, userId: number, emoji: string) {
    const [message] = await this.db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const reactions = message.reactions || [];
    const existingIndex = reactions.findIndex((r: any) => r.userId === userId);

    if (existingIndex >= 0) {
      // Toggle reaction
      if (reactions[existingIndex].emoji === emoji) {
        reactions.splice(existingIndex, 1);
      } else {
        reactions[existingIndex].emoji = emoji;
        reactions[existingIndex].createdAt = new Date();
      }
    } else {
      reactions.push({ emoji, userId, createdAt: new Date() });
    }

    const [updated] = await this.db
      .update(messages)
      .set({ reactions })
      .where(eq(messages.id, messageId))
      .returning();

    return updated;
  }

  async getUnreadCount(userId: number) {
    const [result] = await this.db.execute(sql`
      SELECT SUM(unread_count) as total
      FROM threads
      WHERE user_id = ${userId} AND is_deleted = false
    `);

    return { unreadCount: parseInt(result?.total || 0) };
  }
}
