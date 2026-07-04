import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export class SearchController {
  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, page, limit } = req.query;
      const query = q as string;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;

      if (!query) {
        res.status(200).json({ status: 'success', data: { users: [], posts: [], hashtags: [] } });
        return;
      }

      const [users, posts, hashtags] = await Promise.all([
        prisma.user.findMany({
          where: {
            OR: [
              { username: { contains: query, mode: 'insensitive' as any } },
              { displayName: { contains: query, mode: 'insensitive' as any } },
            ],
            status: 'ACTIVE',
          },
          select: { id: true, username: true, displayName: true, avatar: true, bio: true },
          take: limitNum,
        }),
        prisma.post.findMany({
          where: {
            content: { contains: query, mode: 'insensitive' as any },
            isDraft: false,
          },
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true } },
            media: true,
            _count: { select: { comments: true, reactions: true } },
          },
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.hashtag.findMany({
          where: { name: { contains: query.toLowerCase(), mode: 'insensitive' as any } },
          orderBy: { count: 'desc' },
          take: limitNum,
        }),
      ]);

      res.status(200).json({
        status: 'success',
        data: { users, posts, hashtags },
      });
    } catch (error) {
      next(error);
    }
  };

  searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, page, limit } = req.query;
      const query = q as string;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const skip = (pageNum - 1) * limitNum;

      const where = query
        ? {
            OR: [
              { username: { contains: query, mode: 'insensitive' as any } },
              { displayName: { contains: query, mode: 'insensitive' as any } },
            ],
            status: 'ACTIVE' as const,
          }
        : { status: 'ACTIVE' as const };

      const [users, total] = await Promise.all([
        prisma.user.findMany({ where, skip, take: limitNum, select: { id: true, username: true, displayName: true, avatar: true, bio: true } }),
        prisma.user.count({ where }),
      ]);

      res.status(200).json({ status: 'success', data: users, pagination: { total, page: pageNum, limit: limitNum } });
    } catch (error) {
      next(error);
    }
  };

  searchPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, page, limit } = req.query;
      const query = q as string;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const skip = (pageNum - 1) * limitNum;

      const where = query
        ? { content: { contains: query, mode: 'insensitive' as any }, isDraft: false }
        : { isDraft: false };

      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            author: { select: { id: true, username: true, displayName: true, avatar: true } },
            media: true,
            _count: { select: { comments: true, reactions: true } },
          },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.post.count({ where }),
      ]);

      res.status(200).json({ status: 'success', data: posts, pagination: { total, page: pageNum, limit: limitNum } });
    } catch (error) {
      next(error);
    }
  };

  searchHashtags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      const query = q as string;

      const hashtags = await prisma.hashtag.findMany({
        where: query ? { name: { contains: query.toLowerCase() } } : {},
        orderBy: { count: 'desc' },
        take: 20,
      });

      res.status(200).json({ status: 'success', data: hashtags });
    } catch (error) {
      next(error);
    }
  };

  searchPhotos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const skip = (pageNum - 1) * limitNum;

      const [media, total] = await Promise.all([
        prisma.media.findMany({
          where: { type: { startsWith: 'image/' } },
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.media.count({ where: { type: { startsWith: 'image/' } } }),
      ]);

      res.status(200).json({ status: 'success', data: media, pagination: { total, page: pageNum, limit: limitNum } });
    } catch (error) {
      next(error);
    }
  };

  searchVideos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const skip = (pageNum - 1) * limitNum;

      const [media, total] = await Promise.all([
        prisma.media.findMany({
          where: { type: { startsWith: 'video/' } },
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.media.count({ where: { type: { startsWith: 'video/' } } }),
      ]);

      res.status(200).json({ status: 'success', data: media, pagination: { total, page: pageNum, limit: limitNum } });
    } catch (error) {
      next(error);
    }
  };

  searchGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, page, limit } = req.query;
      const query = q as string;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 20;
      const skip = (pageNum - 1) * limitNum;

      const where = query
        ? { name: { contains: query, mode: 'insensitive' as any }, visibility: 'PUBLIC' as const }
        : { visibility: 'PUBLIC' as const };

      const [groups, total] = await Promise.all([
        prisma.group.findMany({
          where,
          include: { _count: { select: { members: true } }, owner: { select: { id: true, username: true } } },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.group.count({ where }),
      ]);

      res.status(200).json({ status: 'success', data: groups, pagination: { total, page: pageNum, limit: limitNum } });
    } catch (error) {
      next(error);
    }
  };
}
