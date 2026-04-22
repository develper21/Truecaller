import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DATABASE_CONNECTION } from '../database/database.module';
import { users } from '../database/schema';
import { eq } from 'drizzle-orm';

export interface PushNotification {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal';
}

export interface NotificationPayload {
  userId: number;
  type: 'incoming_call' | 'spam_warning' | 'new_message' | 'verification' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private fcmEnabled = false;
  private firebaseApp: any;

  constructor(
    @Inject(DATABASE_CONNECTION) private db: any,
    private configService: ConfigService,
  ) {
    this.initializeFirebase();
  }

  private async initializeFirebase() {
    try {
      // Check if Firebase is configured
      const firebaseConfig = this.configService.get('FIREBASE_PROJECT_ID');
      if (!firebaseConfig) {
        this.logger.warn('Firebase not configured - push notifications disabled');
        return;
      }

      // Dynamic import to avoid issues when not configured
      const { initializeApp, cert } = await import('firebase-admin/app');
      const { getMessaging } = await import('firebase-admin/messaging');

      this.firebaseApp = initializeApp({
        credential: cert({
          projectId: this.configService.get('FIREBASE_PROJECT_ID'),
          privateKey: this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
          clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
        }),
      });

      this.fcmEnabled = true;
      this.logger.log('Firebase initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error.message);
    }
  }

  async sendPushNotification(notification: PushNotification): Promise<void> {
    if (!this.fcmEnabled) {
      this.logger.debug(`[FCM Mock] Would send: ${notification.title} to ${notification.token}`);
      return;
    }

    try {
      const { getMessaging } = await import('firebase-admin/messaging');
      const messaging = getMessaging(this.firebaseApp);

      await messaging.send({
        token: notification.token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: notification.priority || 'normal',
          notification: {
            channelId: 'default',
            priority: notification.priority === 'high' ? 'max' : 'default',
          },
        },
        apns: {
          headers: {
            'apns-priority': notification.priority === 'high' ? '10' : '5',
          },
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              badge: 1,
              sound: 'default',
            },
          },
        },
      });

      this.logger.debug(`Push notification sent to ${notification.token}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification:`, error.message);
      throw error;
    }
  }

  async sendToUser(payload: NotificationPayload): Promise<void> {
    // Get user's device tokens
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
      this.logger.warn(`No device tokens found for user ${payload.userId}`);
      return;
    }

    // Send to all user devices
    const promises = user.deviceTokens.map((token: string) =>
      this.sendPushNotification({
        token,
        title: payload.title,
        body: payload.body,
        data: {
          type: payload.type,
          ...payload.data,
        },
        priority: payload.type === 'incoming_call' ? 'high' : 'normal',
      }),
    );

    await Promise.all(promises);
  }

  async registerDeviceToken(userId: number, token: string): Promise<void> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    const existingTokens = user.deviceTokens || [];
    
    if (!existingTokens.includes(token)) {
      await this.db.execute(
        `UPDATE users SET device_tokens = array_append(device_tokens, $1) WHERE id = $2`,
        [token, userId],
      );
    }
  }

  async unregisterDeviceToken(userId: number, token: string): Promise<void> {
    await this.db.execute(
      `UPDATE users SET device_tokens = array_remove(device_tokens, $1) WHERE id = $2`,
      [token, userId],
    );
  }

  // Specific notification helpers
  async notifyIncomingCall(userId: number, callerName: string, callerNumber: string): Promise<void> {
    await this.sendToUser({
      userId,
      type: 'incoming_call',
      title: 'Incoming Call',
      body: `${callerName} (${callerNumber})`,
      data: {
        callerName,
        callerNumber,
        action: 'incoming_call',
      },
    });
  }

  async notifySpamWarning(userId: number, callerNumber: string, spamType: string): Promise<void> {
    await this.sendToUser({
      userId,
      type: 'spam_warning',
      title: 'Spam Call Alert',
      body: `Potential ${spamType} call from ${callerNumber}`,
      data: {
        callerNumber,
        spamType,
        action: 'spam_warning',
      },
    });
  }

  async notifyNewMessage(userId: number, senderName: string, messagePreview: string): Promise<void> {
    await this.sendToUser({
      userId,
      type: 'new_message',
      title: senderName,
      body: messagePreview,
      data: {
        senderName,
        action: 'new_message',
      },
    });
  }

  async notifyVerificationStatus(userId: number, status: 'verified' | 'rejected', entity: string): Promise<void> {
    const title = status === 'verified' ? 'Verification Approved' : 'Verification Rejected';
    const body = status === 'verified' 
      ? `Your ${entity} has been verified successfully!`
      : `Your ${entity} verification was rejected. Please check and resubmit.`;

    await this.sendToUser({
      userId,
      type: 'verification',
      title,
      body,
      data: {
        status,
        entity,
        action: 'verification_update',
      },
    });
  }
}
