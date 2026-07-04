import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';

export const logActivity = (action: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (req.user) {
      try {
        await prisma.activityLog.create({
          data: {
            action,
            userId: req.user.userId,
            ipAddress: req.ip || req.socket.remoteAddress || null,
            userAgent: req.headers['user-agent'] || null,
            details: {
              method: req.method,
              path: req.path,
              body: req.method === 'GET' ? undefined : sanitizeBody(req.body),
            },
          },
        });
      } catch {
        // Don't block the request if logging fails
      }
    }
    next();
  };
};

function sanitizeBody(body: any): any {
  if (!body) return body;
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.token;
  delete sanitized.refreshToken;
  return sanitized;
}
