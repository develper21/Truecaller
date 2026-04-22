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
import { CallLogsService } from './call-logs.service';

class CreateCallLogDto {
  callerNumber: string;
  calleeNumber?: string;
  type: 'incoming' | 'outgoing' | 'missed' | 'spam';
  status?: string;
  duration?: number;
  isSpam?: boolean;
  notes?: string;
}

@ApiTags('Call Logs')
@Controller('call-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CallLogsController {
  constructor(private readonly callLogsService: CallLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get call logs' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'isSpam', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getCallLogs(
    @Request() req,
    @Query('type') type?: string,
    @Query('isSpam') isSpam?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.callLogsService.getCallLogs(req.user.sub, {
      type,
      isSpam: isSpam === 'true',
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get call statistics' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getStats(@Request() req, @Query('days') days?: string) {
    return this.callLogsService.getCallStats(req.user.sub, days ? parseInt(days) : 30);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent calls' })
  async getRecent(@Request() req, @Query('limit') limit?: string) {
    return this.callLogsService.getRecentCalls(req.user.sub, limit ? parseInt(limit) : 10);
  }

  @Get('spam')
  @ApiOperation({ summary: 'Get spam calls' })
  async getSpamCalls(@Request() req, @Query('limit') limit?: string) {
    return this.callLogsService.getSpamCalls(req.user.sub, limit ? parseInt(limit) : 50);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get call log by ID' })
  @ApiParam({ name: 'id', type: Number })
  async getCallLog(@Request() req, @Param('id') id: number) {
    return this.callLogsService.getCallLogById(req.user.sub, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create call log' })
  async createCallLog(@Request() req, @Body() data: CreateCallLogDto) {
    return this.callLogsService.createCallLog(req.user.sub, data);
  }

  @Get('history/:number')
  @ApiOperation({ summary: 'Get call history for a number' })
  async getHistory(@Param('number') number: string, @Query('limit') limit?: string) {
    return this.callLogsService.getCallHistory(number, limit ? parseInt(limit) : 10);
  }
}
