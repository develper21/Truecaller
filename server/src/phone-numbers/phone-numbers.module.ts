import { Module } from '@nestjs/common';
import { PhoneNumbersService } from './phone-numbers.service';
import { PhoneNumbersController } from './phone-numbers.controller';

@Module({
  providers: [PhoneNumbersService],
  controllers: [PhoneNumbersController],
  exports: [PhoneNumbersService],
})
export class PhoneNumbersModule {}
