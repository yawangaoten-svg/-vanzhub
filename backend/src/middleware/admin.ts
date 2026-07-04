import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import prisma from '../config/database';

export const requireAdmin = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { status: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Account is not active', 403);
    }

    const isAdmin = req.user.email === 'admin@vanzhub.com' || false;
    if (!isAdmin) {
      throw new AppError('Admin access required', 403);
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError('Admin authorization failed', 403));
  }
};
