import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CallWebSocketGateway } from './websocket.gateway';
import { CallOverlayService } from './call-overlay.service';
import { WsJwtGuard } from './ws-jwt.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { MLModule } from '../ml/ml.module';

@Module({
  imports: [
    NotificationsModule,
    MLModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'super-secret-key'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CallWebSocketGateway, CallOverlayService, WsJwtGuard],
  exports: [CallOverlayService],
})
export class GatewayModule {}
