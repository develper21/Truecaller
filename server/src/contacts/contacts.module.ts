import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { PhoneNumbersModule } from '../phone-numbers/phone-numbers.module';

@Module({
  imports: [PhoneNumbersModule],
  providers: [ContactsService],
  controllers: [ContactsController],
  exports: [ContactsService],
})
export class ContactsModule {}
