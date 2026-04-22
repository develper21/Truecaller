import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SpamReportsService } from './spam-reports.service';

class CreateSpamReportDto {
  phoneNumber: string;
  category: 'telemarketer' | 'fraud' | 'insurance' | 'loan' | 'political' | 'other';
  reason?: string;
  evidence?: any;
}

@ApiTags('Spam Reports')
@Controller('spam-reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SpamReportsController {
  constructor(private readonly spamReportsService: SpamReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my spam reports' })
  async getMyReports(@Request() req) {
    return this.spamReportsService.getUserReports(req.user.sub);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get spam reporting stats' })
  async getStats(@Request() req) {
    return this.spamReportsService.getSpamStats(req.user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Submit spam report' })
  async createReport(@Request() req, @Body() data: CreateSpamReportDto) {
    return this.spamReportsService.createReport(req.user.sub, data);
  }

  @Get('top-spammers')
  @ApiOperation({ summary: 'Get top reported numbers' })
  async getTopSpammers(@Query('limit') limit?: string) {
    return this.spamReportsService.getTopSpammers(limit ? parseInt(limit) : 10);
  }
}
