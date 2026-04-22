import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';
import { CallOverlayService } from './call-overlay.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MLService } from '../ml/ml.service';

interface CallStartData {
  callerNumber: string;
  calleeNumber: string;
  callId?: string;
}

interface CallEndData {
  callId: string;
  duration: number;
  isSpam?: boolean;
}

interface CallerInfoResponse {
  callId: string;
  callerNumber: string;
  name?: string;
  businessName?: string;
  trustLevel: 'verified' | 'trusted' | 'neutral' | 'risky' | 'spam';
  riskScore: number;
  isSpam: boolean;
  spamReasons?: string[];
  location?: string;
  avatar?: string;
  category?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/calls',
})
@UseGuards(WsJwtGuard)
export class CallWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CallWebSocketGateway.name);
  private userSockets: Map<number, string> = new Map(); // userId -> socketId

  constructor(
    private callOverlayService: CallOverlayService,
    private notificationsService: NotificationsService,
    private mlService: MLService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    try {
      const userId = client.handshake.auth.userId;
      if (userId) {
        this.userSockets.set(userId, client.id);
        this.logger.log(`User ${userId} connected: ${client.id}`);
      }
    } catch (error) {
      this.logger.error('Connection error:', error.message);
    }
  }

  handleDisconnect(client: Socket) {
    // Remove user from tracking
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        this.logger.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  @SubscribeMessage('call:incoming')
  async handleIncomingCall(
    @MessageBody() data: CallStartData,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userId = client.handshake.auth.userId;
    const callId = data.callId || this.generateCallId();

    this.logger.log(`Incoming call from ${data.callerNumber} to ${data.calleeNumber}`);

    try {
      // Get caller info in real-time
      const callerInfo = await this.callOverlayService.getCallerInfo(
        data.callerNumber,
        data.calleeNumber,
      );

      // Run ML prediction for spam
      const spamPrediction = await this.mlService.predictSpam(data.callerNumber);

      const response: CallerInfoResponse = {
        callId,
        callerNumber: data.callerNumber,
        name: callerInfo.name,
        businessName: callerInfo.businessName,
        trustLevel: (callerInfo.trustLevel as CallerInfoResponse['trustLevel']) || 'neutral',
        riskScore: spamPrediction.confidence,
        isSpam: spamPrediction.isSpam,
        spamReasons: spamPrediction.factors,
        location: callerInfo.location,
        avatar: callerInfo.avatar,
        category: callerInfo.category,
      };

      // Send overlay data to callee
      client.emit('call:overlay', response);

      // Send push notification if app in background
      await this.notificationsService.notifyIncomingCall(
        userId,
        callerInfo.name || data.callerNumber,
        data.callerNumber,
      );

      // Log the call
      await this.callOverlayService.logCallStart(callId, data);

    } catch (error) {
      this.logger.error('Error handling incoming call:', error.message);
      client.emit('call:error', { message: 'Failed to get caller info' });
    }
  }

  @SubscribeMessage('call:accepted')
  async handleCallAccepted(
    @MessageBody() data: { callId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.callOverlayService.updateCallStatus(data.callId, 'accepted');
    client.emit('call:status', { callId: data.callId, status: 'accepted' });
  }

  @SubscribeMessage('call:rejected')
  async handleCallRejected(
    @MessageBody() data: { callId: string; reason?: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    await this.callOverlayService.updateCallStatus(data.callId, 'rejected', data.reason);
    client.emit('call:status', { callId: data.callId, status: 'rejected' });
  }

  @SubscribeMessage('call:ended')
  async handleCallEnded(
    @MessageBody() data: CallEndData,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userId = client.handshake.auth.userId;

    try {
      await this.callOverlayService.logCallEnd(data.callId, {
        duration: data.duration,
        isSpam: data.isSpam,
        userId,
      });

      client.emit('call:completed', { callId: data.callId });
    } catch (error) {
      this.logger.error('Error ending call:', error.message);
    }
  }

  @SubscribeMessage('call:report_spam')
  async handleSpamReport(
    @MessageBody() data: { callId: string; category: string; reason: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const userId = client.handshake.auth.userId;

    try {
      await this.callOverlayService.reportSpamFromCall(
        data.callId,
        userId,
        data.category,
        data.reason,
      );

      client.emit('call:reported', { callId: data.callId, success: true });
    } catch (error) {
      this.logger.error('Error reporting spam:', error.message);
      client.emit('call:error', { message: 'Failed to report spam' });
    }
  }

  @SubscribeMessage('user:status')
  handleUserStatus(
    @MessageBody() data: { status: 'available' | 'busy' | 'dnd' },
    @ConnectedSocket() client: Socket,
  ): void {
    const userId = client.handshake.auth.userId;
    this.logger.log(`User ${userId} status: ${data.status}`);
    // Store status for routing decisions
  }

  // Broadcast to specific user
  sendToUser(userId: number, event: string, data: any): void {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any): void {
    this.server.emit(event, data);
  }

  private generateCallId(): string {
    return `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
