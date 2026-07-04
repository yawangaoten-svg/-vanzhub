import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export class AdminController {
  getDashboard = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [
        totalUsers,
        totalPosts,
        totalComments,
        totalGroups,
        activeUsersToday,
        pendingReports,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.comment.count(),
        prisma.group.count(),
        prisma.user.count({
          where: { lastActivityAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        }),
        prisma.report.count({ where: { status: 'PENDING' } }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          totalUsers,
          totalPosts,
          totalComments,
          totalGroups,
          activeUsersToday,
          pendingReports,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            status: true,
            emailVerified: true,
            createdAt: true,
            lastLoginAt: true,
            _count: { select: { posts: true, followers: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
      ]);

      res.status(200).json({
        status: 'success',
        data: users,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  };

  updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body;
      await prisma.user.update({
        where: { id: req.params.userId },
        data: { status },
      });
      res.status(200).json({ status: 'success', message: 'User status updated' });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await prisma.user.update({
        where: { id: req.params.userId },
        data: { status: 'DELETED' },
      });
      res.status(200).json({ status: 'success', message: 'User deleted' });
    } catch (error) {
      next(error);
    }
  };

  getReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          include: {
            reporter: { select: { id: true, username: true } },
            reported: { select: { id: true, username: true, displayName: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.report.count(),
      ]);

      res.status(200).json({
        status: 'success',
        data: reports,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  };

  updateReportStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.body;
      await prisma.report.update({
        where: { id: req.params.reportId },
        data: { status, resolvedAt: new Date(), resolvedBy: req.user!.userId },
      });
      res.status(200).json({ status: 'success', message: 'Report status updated' });
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [userRegistrations, postCount, reactionCount, messageCount] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.post.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.reaction.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.message.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          userRegistrations,
          postCount,
          reactionCount,
          messageCount,
          period: { from: thirtyDaysAgo, to: now },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getActivityLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
          include: { user: { select: { id: true, username: true } } },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.activityLog.count(),
      ]);

      res.status(200).json({
        status: 'success',
        data: logs,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  };
}
