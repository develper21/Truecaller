import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

class RegisterTokenDto {
  token: string;
}

class TestNotificationDto {
  title: string;
  body: string;
}

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  @ApiOperation({ summary: 'Register FCM device token' })
  async registerToken(@Request() req, @Body() data: RegisterTokenDto) {
    await this.notificationsService.registerDeviceToken(req.user.sub, data.token);
    return { message: 'Device token registered successfully' };
  }

  @Delete('unregister-token')
  @ApiOperation({ summary: 'Unregister FCM device token' })
  async unregisterToken(@Request() req, @Body() data: RegisterTokenDto) {
    await this.notificationsService.unregisterDeviceToken(req.user.sub, data.token);
    return { message: 'Device token unregistered successfully' };
  }

  @Post('test')
  @ApiOperation({ summary: 'Send test notification (debug only)' })
  async testNotification(@Request() req, @Body() data: TestNotificationDto) {
    await this.notificationsService.sendToUser({
      userId: req.user.sub,
      type: 'system',
      title: data.title,
      body: data.body,
    });
    return { message: 'Test notification sent' };
  }
}
