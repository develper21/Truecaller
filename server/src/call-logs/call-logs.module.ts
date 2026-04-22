import { Module } from '@nestjs/common';
import { CallLogsService } from './call-logs.service';
import { CallLogsController } from './call-logs.controller';
import { PhoneNumbersModule } from '../phone-numbers/phone-numbers.module';

@Module({
  imports: [PhoneNumbersModule],
  providers: [CallLogsService],
  controllers: [CallLogsController],
  exports: [CallLogsService],
})
export class CallLogsModule {}
