import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = this.extractToken(client);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Attach user info to socket
      client.handshake.auth.userId = payload.sub;
      client.handshake.auth.user = payload;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(client: Socket): string | undefined {
    // Try to get token from handshake auth
    const auth = client.handshake.auth;
    if (auth?.token) {
      return auth.token.replace('Bearer ', '');
    }

    // Try to get from query params
    const query = client.handshake.query;
    if (query?.token) {
      return String(query.token).replace('Bearer ', '');
    }

    // Try to get from headers
    const headers = client.handshake.headers;
    const authHeader = headers?.authorization;
    if (authHeader) {
      return authHeader.replace('Bearer ', '');
    }

    return undefined;
  }
}
