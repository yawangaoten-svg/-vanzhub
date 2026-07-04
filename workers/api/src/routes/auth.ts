import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Env } from '../config';
import { getPrisma } from '../database';
import { AppError } from '../error-handler';
import { authenticate } from '../auth-middleware';
import { generateToken, generateRefreshToken, verifyRefreshToken, hashPassword, comparePassword, generateVerificationToken } from '../helpers';
import { createEmailService } from '../email-service';

const router = new Hono<{ Bindings: Env; Variables: { user: any } }>();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(2).max(50),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({ email: z.string().email() });

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

const twoFactorSchema = z.object({ token: z.string().length(6) });

router.post('/register', zValidator('json', registerSchema), async (c) => {
  const input = c.req.valid('json');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingEmail) throw new AppError('Email already registered', 409);

  const existingUsername = await prisma.user.findUnique({ where: { username: input.username } });
  if (existingUsername) throw new AppError('Username already taken', 409);

  const passwordHash = await hashPassword(input.password, 12);
  const verificationToken = generateVerificationToken();

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      displayName: input.displayName,
      passwordHash,
      emailVerificationToken: verificationToken,
    },
    select: { id: true, email: true, username: true, displayName: true, avatar: true, createdAt: true },
  });

  const tokenPayload = { userId: user.id, email: user.email, username: user.username };
  const accessToken = generateToken(tokenPayload, c.env.JWT_SECRET, '15m');
  const refreshToken = generateRefreshToken(tokenPayload, c.env.JWT_REFRESH_SECRET, '7d');

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  const emailService = createEmailService(c.env);
  await emailService.sendVerificationEmail(user.email, verificationToken, c.env.CORS_ORIGINS?.split(',')[0] || 'https://vanzhub.com');

  return c.json({ status: 'success', data: { user, accessToken, refreshToken } }, 201);
});

router.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid email or password', 401);
  if (user.status === 'SUSPENDED' || user.status === 'BANNED') throw new AppError('Account has been suspended', 403);

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) throw new AppError('Invalid email or password', 401);

  const tokenPayload = { userId: user.id, email: user.email, username: user.username };
  const accessToken = generateToken(tokenPayload, c.env.JWT_SECRET, '15m');
  const refreshToken = generateRefreshToken(tokenPayload, c.env.JWT_REFRESH_SECRET, '7d');

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken, lastLoginAt: new Date() } });

  const { passwordHash: _, refreshToken: rt, twoFactorSecret, twoFactorBackupCodes, emailVerificationToken, ...safeUser } = user;

  return c.json({
    status: 'success',
    data: { user: safeUser, accessToken, refreshToken, requiresTwoFactor: user.twoFactorEnabled },
  });
});

router.post('/logout', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  await prisma.user.update({ where: { id: user.userId }, data: { refreshToken: null } });
  return c.json({ status: 'success', message: 'Logged out successfully' });
});

router.get('/me', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const me = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true, email: true, username: true, displayName: true, bio: true,
      avatar: true, coverPhoto: true, location: true, website: true,
      emailVerified: true, twoFactorEnabled: true, status: true, privacy: true, createdAt: true,
      _count: { select: { followers: true, following: true, posts: true } },
    },
  });

  if (!me) throw new AppError('User not found', 404);
  return c.json({ status: 'success', data: me });
});

router.post('/refresh', async (c) => {
  const { refreshToken: token } = await c.req.json();
  if (!token) throw new AppError('Refresh token is required', 400);

  try {
    const decoded = verifyRefreshToken(token, c.env.JWT_REFRESH_SECRET);
    const prisma = getPrisma(c.env.DATABASE_URL);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || user.refreshToken !== token) throw new AppError('Invalid refresh token', 401);

    const tokenPayload = { userId: user.id, email: user.email, username: user.username };
    const accessToken = generateToken(tokenPayload, c.env.JWT_SECRET, '15m');
    const newRefreshToken = generateRefreshToken(tokenPayload, c.env.JWT_REFRESH_SECRET, '7d');

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });
    return c.json({ status: 'success', data: { accessToken, refreshToken: newRefreshToken } });
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }
});

router.post('/verify-email', async (c) => {
  const { token } = await c.req.json();
  const prisma = getPrisma(c.env.DATABASE_URL);

  const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
  if (!user) throw new AppError('Invalid verification token', 400);

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, emailVerificationToken: null },
  });
  return c.json({ status: 'success', message: 'Email verified successfully' });
});

router.post('/forgot-password', zValidator('json', forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid('json');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const resetToken = generateVerificationToken();
    await prisma.user.update({ where: { id: user.id }, data: { emailVerificationToken: resetToken } });
    const emailService = createEmailService(c.env);
    await emailService.sendPasswordResetEmail(email, resetToken, c.env.CORS_ORIGINS?.split(',')[0] || 'https://vanzhub.com');
  }

  return c.json({ status: 'success', message: 'Password reset email sent if account exists' });
});

router.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  const { token, password } = c.req.valid('json');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });
  if (!user) throw new AppError('Invalid or expired reset token', 400);

  const passwordHash = await hashPassword(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, emailVerificationToken: null },
  });
  return c.json({ status: 'success', message: 'Password reset successfully' });
});

router.post('/enable-2fa', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const speakeasy = require('speakeasy');
  const secret = speakeasy.generateSecret({ length: 20, name: 'VANZHUB' });

  await prisma.user.update({
    where: { id: user.userId },
    data: { twoFactorSecret: secret.base32 },
  });

  return c.json({ status: 'success', data: { secret: secret.base32, otpauthUrl: secret.otpauth_url } });
});

router.post('/verify-2fa', authenticate, zValidator('json', twoFactorSchema), async (c) => {
  const { token } = c.req.valid('json');
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser || !dbUser.twoFactorSecret) throw new AppError('Two-factor authentication not set up', 400);

  const speakeasy = require('speakeasy');
  const verified = speakeasy.totp.verify({ secret: dbUser.twoFactorSecret, encoding: 'base32', token });

  if (!verified) throw new AppError('Invalid two-factor token', 400);

  await prisma.user.update({ where: { id: user.userId }, data: { twoFactorEnabled: true } });
  return c.json({ status: 'success', message: 'Two-factor authentication enabled' });
});

router.post('/disable-2fa', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  await prisma.user.update({
    where: { id: user.userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: null },
  });
  return c.json({ status: 'success', message: 'Two-factor authentication disabled' });
});

export default router;
