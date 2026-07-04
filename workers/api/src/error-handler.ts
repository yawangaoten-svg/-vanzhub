import { Context } from 'hono';

export class AppError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json({ status: 'error', message: err.message }, err.statusCode as any);
  }
  console.error('Unhandled error:', err);
  return c.json({ status: 'error', message: 'Internal server error' }, 500);
}
