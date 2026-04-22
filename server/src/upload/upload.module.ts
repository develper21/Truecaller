import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { S3Service } from './s3.service';

@Module({
  providers: [UploadService, S3Service],
  controllers: [UploadController],
  exports: [UploadService, S3Service],
})
export class UploadModule {}
