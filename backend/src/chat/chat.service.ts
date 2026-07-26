import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageProvider } from '../storage/storage.provider';
import { ScannerService } from '../scanner/scanner.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageProvider,
    private scannerService: ScannerService,
  ) {}

  async getInbox(userId: number) {
    return this.prisma.chat.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        participant1: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } },
        participant2: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getHistory(chatId: number, userId: number) {
    const chat = await this.prisma.chat.findFirst({
      where: {
        id: chatId,
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }

  async saveMessage(chatId: number, senderId: number, text: string, file?: Express.Multer.File) {
    let attachmentUrl: string | null = null;

    if (file) {
      await this.scannerService.scanBuffer(file.buffer);
      attachmentUrl = await this.storageService.uploadFile(file, 'chat/attachments');
    }

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId,
        text,
        attachmentUrl,
      },
    });

    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async findOrCreateRoom(userId1: number, userId2: number) {
    if (userId1 === userId2) {
      throw new BadRequestException('Cannot create a chat with yourself');
    }

    // Ensure deterministic ordering to avoid duplicate pairs
    const participant1Id = Math.min(userId1, userId2);
    const participant2Id = Math.max(userId1, userId2);

    let chat = await this.prisma.chat.findUnique({
      where: {
        participant1Id_participant2Id: { participant1Id, participant2Id },
      },
      include: {
        participant1: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } },
        participant2: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } },
      },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: { participant1Id, participant2Id },
        include: {
          participant1: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } },
          participant2: { select: { id: true, name: true, avatarUrl: true, isOnline: true, lastSeen: true } },
        },
      });
    }

    return chat;
  }

  async getUnreadCount(userId: number) {
    const unreadMessages = await this.prisma.message.count({
      where: {
        chat: {
          OR: [
            { participant1Id: userId },
            { participant2Id: userId },
          ],
        },
        senderId: { not: userId },
        isRead: false,
      },
    });
    return { unreadMessages };
  }

  async markChatAsRead(chatId: number, userId: number) {
    await this.prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
    return { success: true };
  }
}
