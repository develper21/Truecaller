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
import { AdminService } from './admin.service';

class ModerateUserDto {
  action: 'suspend' | 'ban' | 'restore';
  reason: string;
}

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('verifications')
  @ApiOperation({ summary: 'Get pending verification queue' })
  async getVerificationQueue() {
    return this.adminService.getVerificationQueue();
  }

  @Get('reports/pending')
  @ApiOperation({ summary: 'Get pending spam reports for review' })
  async getPendingReports() {
    return this.adminService.getPendingReports();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get system audit logs' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getAuditLogs({
      userId: userId ? parseInt(userId) : undefined,
      action,
      limit: limit ? parseInt(limit) : 100,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get detailed user information' })
  @ApiParam({ name: 'id', type: Number })
  async getUserDetails(@Param('id') id: number) {
    return this.adminService.getUserDetails(id);
  }

  @Post('users/:id/moderate')
  @ApiOperation({ summary: 'Moderate user (suspend/ban/restore)' })
  @ApiParam({ name: 'id', type: Number })
  async moderateUser(
    @Request() req,
    @Param('id') userId: number,
    @Body() data: ModerateUserDto,
  ) {
    return this.adminService.moderateUser(userId, data.action, data.reason, req.user.sub);
  }

  @Get('top-spammers')
  @ApiOperation({ summary: 'Get top reported spam numbers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopSpammers(@Query('limit') limit?: string) {
    return this.adminService.getTopSpammers(limit ? parseInt(limit) : 100);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}
