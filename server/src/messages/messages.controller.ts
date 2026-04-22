import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';

class CreateThreadDto {
  participantId?: number;
  participantNumber?: string;
  businessAccountId?: number;
  type?: string;
  subject?: string;
}

class SendMessageDto {
  content: string;
  type?: string;
  mediaUrl?: string;
  mediaType?: string;
  replyToId?: number;
}

class EditMessageDto {
  content: string;
}

class ReactionDto {
  emoji: string;
}

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // Threads
  @Post('threads')
  @ApiOperation({ summary: 'Create new conversation thread' })
  async createThread(@Request() req, @Body() data: CreateThreadDto) {
    return this.messagesService.createThread(req.user.sub, data);
  }

  @Get('threads')
  @ApiOperation({ summary: 'Get my conversation threads' })
  @ApiQuery({ name: 'archived', required: false, type: Boolean })
  @ApiQuery({ name: 'pinned', required: false, type: Boolean })
  async getThreads(
    @Request() req,
    @Query('archived') archived?: string,
    @Query('pinned') pinned?: string,
  ) {
    return this.messagesService.getThreads(req.user.sub, {
      archived: archived === 'true',
      pinned: pinned === 'true',
    });
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Get thread by ID' })
  @ApiParam({ name: 'id', type: Number })
  async getThread(@Request() req, @Param('id') id: number) {
    return this.messagesService.getThreadById(id, req.user.sub);
  }

  @Put('threads/:id')
  @ApiOperation({ summary: 'Update thread (pin, archive, mute)' })
  async updateThread(
    @Request() req,
    @Param('id') id: number,
    @Body() data: { isPinned?: boolean; isArchived?: boolean; isMuted?: boolean },
  ) {
    return this.messagesService.updateThread(req.user.sub, id, data);
  }

  @Post('threads/:id/read')
  @ApiOperation({ summary: 'Mark thread as read' })
  @ApiParam({ name: 'id', type: Number })
  async markAsRead(@Request() req, @Param('id') id: number) {
    return this.messagesService.markAsRead(id, req.user.sub);
  }

  // Messages
  @Post('threads/:id/messages')
  @ApiOperation({ summary: 'Send message to thread' })
  @ApiParam({ name: 'id', type: Number })
  async sendMessage(
    @Request() req,
    @Param('id') threadId: number,
    @Body() data: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(threadId, req.user.sub, data);
  }

  @Get('threads/:id/messages')
  @ApiOperation({ summary: 'Get messages in thread' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMessages(
    @Request() req,
    @Param('id') threadId: number,
    @Query('limit') limit?: string,
  ) {
    return this.messagesService.getMessages(threadId, req.user.sub, {
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Put('messages/:id')
  @ApiOperation({ summary: 'Edit message' })
  @ApiParam({ name: 'id', type: Number })
  async editMessage(
    @Request() req,
    @Param('id') id: number,
    @Body() data: EditMessageDto,
  ) {
    return this.messagesService.editMessage(id, req.user.sub, data.content);
  }

  @Delete('messages/:id')
  @ApiOperation({ summary: 'Delete message' })
  @ApiParam({ name: 'id', type: Number })
  async deleteMessage(@Request() req, @Param('id') id: number) {
    return this.messagesService.deleteMessage(id, req.user.sub);
  }

  @Post('messages/:id/reaction')
  @ApiOperation({ summary: 'Add reaction to message' })
  @ApiParam({ name: 'id', type: Number })
  async addReaction(
    @Request() req,
    @Param('id') id: number,
    @Body() data: ReactionDto,
  ) {
    return this.messagesService.addReaction(id, req.user.sub, data.emoji);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count' })
  async getUnreadCount(@Request() req) {
    return this.messagesService.getUnreadCount(req.user.sub);
  }
}
