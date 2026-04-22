import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Enums
export const trustLevelEnum = pgEnum('trust_level', ['verified', 'trusted', 'neutral', 'risky', 'spam']);
export const riskScoreEnum = pgEnum('risk_score', ['low', 'medium', 'high', 'critical']);
export const verificationTierEnum = pgEnum('verification_tier', ['gold', 'silver', 'bronze']);
export const callTypeEnum = pgEnum('call_type', ['incoming', 'outgoing', 'missed', 'spam']);
export const reportCategoryEnum = pgEnum('report_category', ['telemarketer', 'fraud', 'insurance', 'loan', 'political', 'other']);

// Users table - Auth and account data
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  isVerified: boolean('is_verified').default(false),
  verificationCode: varchar('verification_code', { length: 10 }),
  verificationCodeExpiry: timestamp('verification_code_expiry'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').default(true),
  deviceTokens: jsonb('device_tokens').$type<string[]>(),
  settings: jsonb('settings').$type<{
    darkMode: boolean;
    notifications: boolean;
    privacyLevel: 'public' | 'contacts' | 'private';
    language: string;
  }>(),
}, (table) => ({
  phoneIdx: uniqueIndex('phone_idx').on(table.phoneNumber),
  emailIdx: index('email_idx').on(table.email),
}));

// Profiles table - Public-facing identity
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  displayName: varchar('display_name', { length: 100 }),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  location: varchar('location', { length: 100 }),
  country: varchar('country', { length: 2 }),
  trustLevel: trustLevelEnum('trust_level').default('neutral'),
  riskScore: riskScoreEnum('risk_score').default('low'),
  trustScore: integer('trust_score').default(50),
  isVerified: boolean('is_verified').default(false),
  verificationTier: verificationTierEnum('verification_tier'),
  isBusiness: boolean('is_business').default(false),
  businessName: varchar('business_name', { length: 100 }),
  businessCategory: varchar('business_category', { length: 50 }),
  workingHours: jsonb('working_hours'),
  totalCalls: integer('total_calls').default(0),
  profileViews: integer('profile_views').default(0),
  reviewCount: integer('review_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: uniqueIndex('profile_user_idx').on(table.userId),
  trustIdx: index('trust_idx').on(table.trustLevel),
  riskIdx: index('risk_idx').on(table.riskScore),
}));

// Phone Numbers table - Normalized number records
export const phoneNumbers = pgTable('phone_numbers', {
  id: serial('id').primaryKey(),
  number: varchar('number', { length: 20 }).notNull().unique(),
  normalizedNumber: varchar('normalized_number', { length: 20 }).notNull(),
  countryCode: varchar('country_code', { length: 5 }),
  carrier: varchar('carrier', { length: 50 }),
  lineType: varchar('line_type', { length: 20 }), // mobile, landline, voip
  trustLevel: trustLevelEnum('trust_level').default('neutral'),
  riskScore: riskScoreEnum('risk_score').default('low'),
  trustScore: integer('trust_score').default(50),
  isVerified: boolean('is_verified').default(false),
  verificationTier: verificationTierEnum('verification_tier'),
  isBusiness: boolean('is_business').default(false),
  spamReportCount: integer('spam_report_count').default(0),
  safeVoteCount: integer('safe_vote_count').default(0),
  spamVoteCount: integer('spam_vote_count').default(0),
  lastSearchedAt: timestamp('last_searched_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  numberIdx: uniqueIndex('number_idx').on(table.number),
  normalizedIdx: index('normalized_idx').on(table.normalizedNumber),
  countryIdx: index('country_idx').on(table.countryCode),
  trustIdx: index('pn_trust_idx').on(table.trustLevel),
  riskIdx: index('pn_risk_idx').on(table.riskScore),
  searchIdx: index('search_idx').on(table.lastSearchedAt),
}));

// Contacts table - User's saved contacts
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  phoneNumberId: integer('phone_number_id').references(() => phoneNumbers.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }),
  isFavorite: boolean('is_favorite').default(false),
  isBlocked: boolean('is_blocked').default(false),
  tags: jsonb('tags').$type<string[]>(),
  syncStatus: varchar('sync_status', { length: 20 }).default('synced'), // synced, pending, error
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('contact_user_idx').on(table.userId),
  phoneIdx: index('contact_phone_idx').on(table.phoneNumberId),
  favIdx: index('fav_idx').on(table.userId, table.isFavorite),
  blockIdx: index('block_idx').on(table.userId, table.isBlocked),
}));

// Call Logs table - Call history
export const callLogs = pgTable('call_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  callerNumberId: integer('caller_number_id').references(() => phoneNumbers.id),
  calleeNumberId: integer('callee_number_id').references(() => phoneNumbers.id),
  type: callTypeEnum('type').notNull(),
  status: varchar('status', { length: 20 }), // completed, missed, rejected, voicemail
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'), // in seconds
  isSpam: boolean('is_spam').default(false),
  notes: text('notes'),
  recordingUrl: text('recording_url'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('call_user_idx').on(table.userId),
  timeIdx: index('call_time_idx').on(table.startedAt),
  typeIdx: index('call_type_idx').on(table.type),
  spamIdx: index('call_spam_idx').on(table.userId, table.isSpam),
}));

// Spam Reports table - User spam reports
export const spamReports = pgTable('spam_reports', {
  id: serial('id').primaryKey(),
  reporterId: integer('reporter_id').references(() => users.id, { onDelete: 'set null' }),
  phoneNumberId: integer('phone_number_id').references(() => phoneNumbers.id, { onDelete: 'cascade' }),
  category: reportCategoryEnum('category').notNull(),
  reason: text('reason'),
  confidence: integer('confidence').default(100), // 0-100
  evidence: jsonb('evidence'), // screenshots, recordings
  reporterTrustScore: integer('reporter_trust_score').default(50),
  status: varchar('status', { length: 20 }).default('pending'), // pending, verified, rejected
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: integer('reviewed_by'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  reporterIdx: index('reporter_idx').on(table.reporterId),
  phoneIdx: index('report_phone_idx').on(table.phoneNumberId),
  categoryIdx: index('category_idx').on(table.category),
  statusIdx: index('status_idx').on(table.status),
  createdIdx: index('created_idx').on(table.createdAt),
}));

// Search History table
export const searchHistory = pgTable('search_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  query: varchar('query', { length: 50 }).notNull(),
  resultCount: integer('result_count').default(0),
  clickedNumberId: integer('clicked_number_id').references(() => phoneNumbers.id),
  searchedAt: timestamp('searched_at').defaultNow(),
}, (table) => ({
  userIdx: index('search_user_idx').on(table.userId),
  timeIdx: index('search_time_idx').on(table.searchedAt),
  queryIdx: index('query_idx').on(table.query),
}));

// Blocked Numbers table - User's block list
export const blockedNumbers = pgTable('blocked_numbers', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  phoneNumberId: integer('phone_number_id').references(() => phoneNumbers.id, { onDelete: 'cascade' }),
  blockedAt: timestamp('blocked_at').defaultNow(),
  reason: varchar('reason', { length: 50 }),
  blockType: varchar('block_type', { length: 20 }).default('manual'), // manual, auto, spam
}, (table) => ({
  userIdx: index('block_user_idx').on(table.userId),
  phoneIdx: uniqueIndex('block_phone_idx').on(table.userId, table.phoneNumberId),
}));

// Tags table - Caller labels
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 30 }).notNull().unique(),
  type: varchar('type', { length: 20 }).notNull(), // business, spam, personal, etc
  color: varchar('color', { length: 7 }).default('#6B7280'),
  usageCount: integer('usage_count').default(0),
}, (table) => ({
  nameIdx: uniqueIndex('tag_name_idx').on(table.name),
  typeIdx: index('tag_type_idx').on(table.type),
}));

// Profile Viewers table - Who viewed my profile
export const profileViewers = pgTable('profile_viewers', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id').references(() => profiles.id, { onDelete: 'cascade' }),
  viewerId: integer('viewer_id').references(() => users.id, { onDelete: 'cascade' }),
  viewerNumberId: integer('viewer_number_id').references(() => phoneNumbers.id),
  viewedAt: timestamp('viewed_at').defaultNow(),
  isRevealed: boolean('is_revealed').default(false), // Premium feature
}, (table) => ({
  profileIdx: index('viewer_profile_idx').on(table.profileId),
  timeIdx: index('viewed_time_idx').on(table.viewedAt),
}));

// Subscriptions table - Premium plans
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  plan: varchar('plan', { length: 20 }).notNull(), // monthly, yearly, lifetime
  status: varchar('status', { length: 20 }).default('active'), // active, cancelled, expired
  startedAt: timestamp('started_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  price: integer('price'), // in cents
  currency: varchar('currency', { length: 3 }).default('INR'),
  features: jsonb('features'), // unlocked features
}, (table) => ({
  userIdx: uniqueIndex('sub_user_idx').on(table.userId),
  statusIdx: index('sub_status_idx').on(table.status),
  expiresIdx: index('expires_idx').on(table.expiresAt),
}));

// Audit Logs table - Security events
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 50 }).notNull(),
  entity: varchar('entity', { length: 50 }), // user, profile, contact, etc
  entityId: integer('entity_id'),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdx: index('audit_user_idx').on(table.userId),
  actionIdx: index('audit_action_idx').on(table.action),
  timeIdx: index('audit_time_idx').on(table.createdAt),
}));

// Business Accounts table - Verified company profiles (separate from profiles as per document)
export const businessAccounts = pgTable('business_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).unique(),
  phoneNumberId: integer('phone_number_id').references(() => phoneNumbers.id),
  companyName: varchar('company_name', { length: 100 }).notNull(),
  legalName: varchar('legal_name', { length: 100 }),
  registrationNumber: varchar('registration_number', { length: 50 }),
  taxId: varchar('tax_id', { length: 50 }),
  businessType: varchar('business_type', { length: 50 }), // LLC, Corp, etc.
  category: varchar('category', { length: 50 }), // telecom, finance, delivery, etc.
  subCategory: varchar('sub_category', { length: 50 }),
  description: text('description'),
  website: varchar('website', { length: 255 }),
  email: varchar('email', { length: 255 }),
  logoUrl: text('logo_url'),
  coverImageUrl: text('cover_image_url'),
  // Address
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 2 }),
  postalCode: varchar('postal_code', { length: 20 }),
  // Working hours
  workingHours: jsonb('working_hours').$type<{
    monday?: { open: string; close: string; isOpen: boolean };
    tuesday?: { open: string; close: string; isOpen: boolean };
    wednesday?: { open: string; close: string; isOpen: boolean };
    thursday?: { open: string; close: string; isOpen: boolean };
    friday?: { open: string; close: string; isOpen: boolean };
    saturday?: { open: string; close: string; isOpen: boolean };
    sunday?: { open: string; close: string; isOpen: boolean };
  }>(),
  timezone: varchar('timezone', { length: 50 }),
  // Call intent/purpose
  callIntent: jsonb('call_intent').$type<string[]>(), // sales, support, billing, etc.
  // Verification
  isVerified: boolean('is_verified').default(false),
  verificationStatus: varchar('verification_status', { length: 20 }).default('pending'), // pending, verified, rejected
  verifiedAt: timestamp('verified_at'),
  verifiedBy: integer('verified_by'),
  verificationDocuments: jsonb('verification_documents').$type<{
    type: string;
    url: string;
    verified: boolean;
  }[]>(),
  // Stats
  totalCalls: integer('total_calls').default(0),
  customerRating: integer('customer_rating'), // 1-5
  reviewCount: integer('review_count').default(0),
  // Status
  status: varchar('status', { length: 20 }).default('active'), // active, suspended, inactive
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: uniqueIndex('biz_user_idx').on(table.userId),
  phoneIdx: index('biz_phone_idx').on(table.phoneNumberId),
  categoryIdx: index('biz_category_idx').on(table.category),
  verifiedIdx: index('biz_verified_idx').on(table.isVerified),
  statusIdx: index('biz_status_idx').on(table.status),
}));

// Threads table - Message conversations
export const threads = pgTable('threads', {
  id: serial('id').primaryKey(),
  // Thread can be between users or with business
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }), // Thread owner
  participantId: integer('participant_id').references(() => users.id, { onDelete: 'set null' }), // Other user
  participantNumberId: integer('participant_number_id').references(() => phoneNumbers.id), // If not a registered user
  businessAccountId: integer('business_account_id').references(() => businessAccounts.id, { onDelete: 'set null' }),
  // Thread metadata
  type: varchar('type', { length: 20 }).default('direct'), // direct, business, group
  subject: varchar('subject', { length: 200 }),
  // Last message info for quick display
  lastMessageAt: timestamp('last_message_at'),
  lastMessagePreview: varchar('last_message_preview', { length: 200 }),
  lastMessageId: integer('last_message_id'),
  // Unread count for this user
  unreadCount: integer('unread_count').default(0),
  // Thread status
  isArchived: boolean('is_archived').default(false),
  isPinned: boolean('is_pinned').default(false),
  isMuted: boolean('is_muted').default(false),
  muteUntil: timestamp('mute_until'),
  // Soft delete
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('thread_user_idx').on(table.userId),
  participantIdx: index('thread_participant_idx').on(table.participantId),
  businessIdx: index('thread_business_idx').on(table.businessAccountId),
  lastMsgIdx: index('thread_last_msg_idx').on(table.lastMessageAt),
  typeIdx: index('thread_type_idx').on(table.type),
}));

// Messages table - Individual messages
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  threadId: integer('thread_id').references(() => threads.id, { onDelete: 'cascade' }).notNull(),
  // Sender info
  senderId: integer('sender_id').references(() => users.id, { onDelete: 'set null' }),
  senderNumberId: integer('sender_number_id').references(() => phoneNumbers.id),
  businessAccountId: integer('business_account_id').references(() => businessAccounts.id, { onDelete: 'set null' }),
  // Message content
  type: varchar('type', { length: 20 }).default('text'), // text, image, audio, video, file, location, contact
  content: text('content'), // Text content or caption
  // Media attachments
  mediaUrl: text('media_url'),
  mediaType: varchar('media_type', { length: 50 }), // image/jpeg, audio/mp3, etc.
  mediaSize: integer('media_size'), // bytes
  mediaDuration: integer('media_duration'), // seconds for audio/video
  thumbnailUrl: text('thumbnail_url'),
  // Location
  location: jsonb('location').$type<{ lat: number; lng: number; address?: string }>(),
  // Contact card
  contactCard: jsonb('contact_card').$type<{ name: string; number: string }>(),
  // Message status
  status: varchar('status', { length: 20 }).default('sent'), // sent, delivered, read, failed
  sentAt: timestamp('sent_at').defaultNow(),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
  failedAt: timestamp('failed_at'),
  // Reply to
  replyToId: integer('reply_to_id').references(() => messages.id),
  // Reactions
  reactions: jsonb('reactions').$type<{ emoji: string; userId: number; createdAt: Date }[]>(),
  // Edit history
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at'),
  originalContent: text('original_content'),
  // Delete
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  deletedBy: integer('deleted_by'),
  // Auto-reply
  isAutoReply: boolean('is_auto_reply').default(false),
  autoReplyTemplateId: varchar('auto_reply_template_id', { length: 50 }),
}, (table) => ({
  threadIdx: index('msg_thread_idx').on(table.threadId),
  senderIdx: index('msg_sender_idx').on(table.senderId),
  statusIdx: index('msg_status_idx').on(table.status),
  sentAtIdx: index('msg_sent_at_idx').on(table.sentAt),
}));

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type NewPhoneNumber = typeof phoneNumbers.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type CallLog = typeof callLogs.$inferSelect;
export type NewCallLog = typeof callLogs.$inferInsert;
export type SpamReport = typeof spamReports.$inferSelect;
export type NewSpamReport = typeof spamReports.$inferInsert;
export type SearchHistory = typeof searchHistory.$inferSelect;
export type NewSearchHistory = typeof searchHistory.$inferInsert;
export type BlockedNumber = typeof blockedNumbers.$inferSelect;
export type NewBlockedNumber = typeof blockedNumbers.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type ProfileViewer = typeof profileViewers.$inferSelect;
export type NewProfileViewer = typeof profileViewers.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type BusinessAccount = typeof businessAccounts.$inferSelect;
export type NewBusinessAccount = typeof businessAccounts.$inferInsert;
export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
