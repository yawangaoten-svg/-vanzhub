import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { Env } from './config';
import { AppError } from './error-handler';

export interface AuthPayload {
  userId: string;
  email: string;
  username: string;
}

export type Variables = {
  user: AuthPayload;
};

export async function authenticate(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  try {
    const authHeader = c.req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const secret = c.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as AuthPayload;

    c.set('user', decoded);
    await next();
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    if (error?.name === 'TokenExpiredError') throw new AppError('Token expired', 401);
    if (error?.name === 'JsonWebTokenError') throw new AppError('Invalid token', 401);
    throw new AppError('Authentication failed', 401);
  }
}

export async function optionalAuth(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) {
  try {
    const authHeader = c.req.header('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const secret = c.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(token, secret) as AuthPayload;
      c.set('user', decoded);
    }
  } catch {}
  await next();
}
