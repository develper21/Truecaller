import { Module } from '@nestjs/common';
import { MLService } from './ml.service';
import { MLController } from './ml.controller';

@Module({
  providers: [MLService],
  controllers: [MLController],
  exports: [MLService],
})
export class MLModule {}
