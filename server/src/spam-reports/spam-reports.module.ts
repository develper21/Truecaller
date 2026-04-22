import { Module } from '@nestjs/common';
import { SpamReportsService } from './spam-reports.service';
import { SpamReportsController } from './spam-reports.controller';
import { PhoneNumbersModule } from '../phone-numbers/phone-numbers.module';

@Module({
  imports: [PhoneNumbersModule],
  providers: [SpamReportsService],
  controllers: [SpamReportsController],
  exports: [SpamReportsService],
})
export class SpamReportsModule {}
