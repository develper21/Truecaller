import { Module } from '@nestjs/common';
import { SMSService } from './sms.service';

@Module({
  providers: [SMSService],
  exports: [SMSService],
})
export class SMSModule {}
