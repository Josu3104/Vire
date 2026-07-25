import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<number, string>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    private prisma: PrismaService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers['authorization']?.split(' ')[1];
      if (!token) throw new Error('No token');

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      this.connectedClients.set(userId, client.id);
      client.data.userId = userId; // Store userId in socket for O(1) disconnect

      // Join a personal room
      client.join(`user_${userId}`);

      // Update online status
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: true },
      });
      this.server.emit('userStatusChanged', { userId, isOnline: true });
    } catch (err) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.connectedClients.get(userId) === client.id) {
      this.connectedClients.delete(userId);
      const lastSeen = new Date();
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen },
      }).catch(() => { });
      this.server.emit('userStatusChanged', { userId, isOnline: false, lastSeen });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number; text: string; receiverId: number },
  ) {
    const senderId = client.data.userId;
    if (!senderId) return; // Unauthenticated

    if (!data.text || data.text.trim().length === 0) {
      return { error: 'Message text cannot be empty' };
    }

    const message = await this.chatService.saveMessage(data.chatId, senderId, data.text);

    // Broadcast to receiver if online
    this.server.to(`user_${data.receiverId}`).emit('newMessage', message);

    // Send ack back to sender
    return message;
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: number },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    await this.chatService.markChatAsRead(data.chatId, userId);

    // We need to notify the other participant that their messages were read
    const chat = await this.prisma.chat.findUnique({
      where: { id: data.chatId }
    });

    if (chat) {
      const otherUserId = chat.participant1Id === userId ? chat.participant2Id : chat.participant1Id;
      this.server.to(`user_${otherUserId}`).emit('messagesRead', { chatId: data.chatId });
    }
  }
}
