import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class MessageService {
  async getConversations(userId: string) {
    const sentMessages = await prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });

    const receivedMessages = await prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const conversationUserIds = new Set([
      ...sentMessages.map(m => m.receiverId),
      ...receivedMessages.map(m => m.senderId),
    ]);

    const conversations = await Promise.all(
      Array.from(conversationUserIds).map(async (otherUserId) => {
        const [lastMessage, otherUser, unreadCount] = await Promise.all([
          prisma.message.findFirst({
            where: {
              OR: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId },
              ],
            },
            orderBy: { createdAt: 'desc' },
            select: { content: true, type: true, createdAt: true, isRead: true },
          }),
          prisma.user.findUnique({
            where: { id: otherUserId },
            select: { id: true, username: true, displayName: true, avatar: true },
          }),
          prisma.message.count({
            where: { senderId: otherUserId, receiverId: userId, isRead: false },
          }),
        ]);

        return { user: otherUser, lastMessage, unreadCount };
      })
    );

    conversations.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
    });

    return conversations;
  }

  async getMessages(userId: string, otherUserId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
      }),
    ]);

    return {
      data: messages.reverse(),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async sendMessage(senderId: string, data: {
    receiverId: string;
    content?: string;
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }) {
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId: data.receiverId,
        content: data.content || null,
        type: (data.type as any) || 'TEXT',
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        fileSize: data.fileSize || null,
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });
    return message;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new AppError('Message not found', 404);
    if (message.senderId !== userId) throw new AppError('Not authorized', 403);

    await prisma.message.delete({ where: { id: messageId } });
  }

  async markAsRead(messageId: string, userId: string) {
    await prisma.message.updateMany({
      where: { id: messageId, receiverId: userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string, otherUserId: string) {
    await prisma.message.updateMany({
      where: { senderId: otherUserId, receiverId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
