import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class MessageController {
  getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;

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
          const lastMessage = await prisma.message.findFirst({
            where: {
              OR: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId },
              ],
            },
            orderBy: { createdAt: 'desc' },
            select: { content: true, type: true, createdAt: true, isRead: true },
          });

          const otherUser = await prisma.user.findUnique({
            where: { id: otherUserId },
            select: { id: true, username: true, displayName: true, avatar: true },
          });

          const unreadCount = await prisma.message.count({
            where: { senderId: otherUserId, receiverId: userId, isRead: false },
          });

          return {
            user: otherUser,
            lastMessage,
            unreadCount,
          };
        })
      );

      conversations.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
      });

      res.status(200).json({ status: 'success', data: conversations });
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.userId;
      const otherUserId = req.params.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: {
            OR: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
            ],
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

      res.status(200).json({
        status: 'success',
        data: messages.reverse(),
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { receiverId, content, type, fileUrl, fileName, fileSize, duration } = req.body;

      const message = await prisma.message.create({
        data: {
          senderId: req.user!.userId,
          receiverId,
          content,
          type: type || 'TEXT',
          fileUrl,
          fileName,
          fileSize,
          duration,
        },
        include: {
          sender: { select: { id: true, username: true, displayName: true, avatar: true } },
        },
      });

      res.status(201).json({ status: 'success', data: message });
    } catch (error) {
      next(error);
    }
  };

  deleteMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const message = await prisma.message.findUnique({ where: { id: req.params.id } });
      if (!message) throw new AppError('Message not found', 404);
      if (message.senderId !== req.user!.userId) throw new AppError('Not authorized', 403);

      await prisma.message.delete({ where: { id: req.params.id } });
      res.status(200).json({ status: 'success', message: 'Message deleted' });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await prisma.message.updateMany({
        where: {
          id: req.params.id,
          receiverId: req.user!.userId,
        },
        data: { isRead: true, readAt: new Date() },
      });

      res.status(200).json({ status: 'success', message: 'Marked as read' });
    } catch (error) {
      next(error);
    }
  };
}
