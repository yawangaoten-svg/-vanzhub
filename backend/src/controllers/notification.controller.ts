import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export class NotificationController {
  getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: req.user!.userId },
          include: {
            actor: { select: { id: true, username: true, displayName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where: { userId: req.user!.userId } }),
      ]);

      res.status(200).json({
        status: 'success',
        data: notifications,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await prisma.notification.count({
        where: { userId: req.user!.userId, isRead: false },
      });

      res.status(200).json({ status: 'success', data: { count } });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await prisma.notification.update({
        where: { id: req.params.id },
        data: { isRead: true },
      });
      res.status(200).json({ status: 'success', message: 'Marked as read' });
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.userId, isRead: false },
        data: { isRead: true },
      });
      res.status(200).json({ status: 'success', message: 'All marked as read' });
    } catch (error) {
      next(error);
    }
  };
}
