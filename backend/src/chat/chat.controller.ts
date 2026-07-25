import { Controller, Get, Param, UseGuards, Request, Post, Body, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Chat')
@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('inbox')
  @ApiOperation({ summary: 'Get current user chat inbox' })
  async getInbox(@Request() req: any) {
    return this.chatService.getInbox(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get(':id/history')
  @ApiOperation({ summary: 'Get chat history by ID' })
  async getHistory(@Param('id') id: string, @Request() req: any) {
    return this.chatService.getHistory(+id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('room')
  @ApiOperation({ summary: 'Find or create a chat room with a target user' })
  async findOrCreateRoom(@Request() req: any, @Body() body: { targetUserId: number }) {
    return this.chatService.findOrCreateRoom(req.user.id, body.targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread chat messages count' })
  async getUnreadCount(@Request() req: any) {
    return this.chatService.getUnreadCount(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a chat as read' })
  async markChatAsRead(@Param('id') id: string, @Request() req: any) {
    return this.chatService.markChatAsRead(+id, req.user.id);
  }
}
