import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  Param,
  Body,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

class UploadDocDto {
  docType: string;
}

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @ApiOperation({ summary: 'Upload profile avatar' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.uploadAvatar(file, req.user.sub);
    return {
      message: 'Avatar uploaded successfully',
      data: result,
    };
  }

  @Post('business/:id/logo')
  @ApiOperation({ summary: 'Upload business logo' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBusinessLogo(
    @Request() req,
    @Param('id', ParseIntPipe) businessId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.uploadBusinessLogo(file, req.user.sub, businessId);
    return {
      message: 'Business logo uploaded successfully',
      data: result,
    };
  }

  @Post('business/:id/verification-doc')
  @ApiOperation({ summary: 'Upload business verification document' })
  @ApiParam({ name: 'id', description: 'Business ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadVerificationDoc(
    @Request() req,
    @Param('id', ParseIntPipe) businessId: number,
    @Body() body: UploadDocDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!body.docType) {
      throw new BadRequestException('docType is required');
    }

    const result = await this.uploadService.uploadVerificationDocument(
      file,
      req.user.sub,
      businessId,
      body.docType,
    );
    return {
      message: 'Verification document uploaded successfully',
      data: result,
    };
  }

  @Post('messages/:threadId/media')
  @ApiOperation({ summary: 'Upload message media' })
  @ApiParam({ name: 'threadId', description: 'Thread ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMessageMedia(
    @Request() req,
    @Param('threadId', ParseIntPipe) threadId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.uploadMessageMedia(file, req.user.sub, threadId);
    return {
      message: 'Media uploaded successfully',
      data: result,
    };
  }

  @Post('call-recording/:callId')
  @ApiOperation({ summary: 'Upload call recording' })
  @ApiParam({ name: 'callId', description: 'Call ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCallRecording(
    @Request() req,
    @Param('callId') callId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.uploadService.uploadCallRecording(file, req.user.sub, callId);
    return {
      message: 'Call recording uploaded successfully',
      data: result,
    };
  }
}
