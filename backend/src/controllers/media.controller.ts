import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class MediaController {
  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const media = await prisma.media.create({
        data: {
          url: `/uploads/${req.file.filename}`,
          type: req.file.mimetype,
          size: req.file.size,
          userId: req.user!.userId,
        },
      });

      res.status(201).json({ status: 'success', data: media });
    } catch (error) {
      next(error);
    }
  };

  uploadMultiple = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new AppError('No files uploaded', 400);
      }

      const mediaItems = await Promise.all(
        files.map(file =>
          prisma.media.create({
            data: {
              url: `/uploads/${file.filename}`,
              type: file.mimetype,
              size: file.size,
              userId: req.user!.userId,
            },
          })
        )
      );

      res.status(201).json({ status: 'success', data: mediaItems });
    } catch (error) {
      next(error);
    }
  };

  uploadVideo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const media = await prisma.media.create({
        data: {
          url: `/uploads/${req.file.filename}`,
          type: req.file.mimetype,
          size: req.file.size,
          userId: req.user!.userId,
        },
      });

      res.status(201).json({ status: 'success', data: media });
    } catch (error) {
      next(error);
    }
  };

  getUserMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const [media, total] = await Promise.all([
        prisma.media.findMany({
          where: { userId: req.user!.userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.media.count({ where: { userId: req.user!.userId } }),
      ]);

      res.status(200).json({
        status: 'success',
        data: media,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const media = await prisma.media.findUnique({ where: { id: req.params.id } });
      if (!media) throw new AppError('Media not found', 404);
      if (media.userId !== req.user!.userId) throw new AppError('Not authorized', 403);

      await prisma.media.delete({ where: { id: req.params.id } });
      res.status(200).json({ status: 'success', message: 'Media deleted' });
    } catch (error) {
      next(error);
    }
  };
}
