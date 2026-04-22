import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PhoneNumbersModule } from './phone-numbers/phone-numbers.module';
import { ContactsModule } from './contacts/contacts.module';
import { CallLogsModule } from './call-logs/call-logs.module';
import { SpamReportsModule } from './spam-reports/spam-reports.module';
import { SearchModule } from './search/search.module';
import { BusinessModule } from './business/business.module';
import { MessagesModule } from './messages/messages.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SMSModule } from './sms/sms.module';
import { MLModule } from './ml/ml.module';
import { GatewayModule } from './gateway/gateway.module';
import { UploadModule } from './upload/upload.module';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { ConfigValidationModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ConfigValidationModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    DatabaseModule,
    RedisModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    PhoneNumbersModule,
    ContactsModule,
    CallLogsModule,
    SpamReportsModule,
    SearchModule,
    BusinessModule,
    MessagesModule,
    AdminModule,
    NotificationsModule,
    SMSModule,
    MLModule,
    GatewayModule,
    UploadModule,
  ],
})
export class AppModule {}
