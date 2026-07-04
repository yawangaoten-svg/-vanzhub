import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  generateVerificationToken,
} from '../utils/helpers';

interface RegisterInput {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    const existingEmail = await prisma.user.findUnique({ where: { email: input.email } });
    if (existingEmail) {
      throw new AppError('Email already registered', 409);
    }

    const existingUsername = await prisma.user.findUnique({ where: { username: input.username } });
    if (existingUsername) {
      throw new AppError('Username already taken', 409);
    }

    const passwordHash = await hashPassword(input.password);
    const verificationToken = generateVerificationToken();

    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        displayName: input.displayName,
        passwordHash,
        emailVerificationToken: verificationToken,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        createdAt: true,
      },
    });

    const tokenPayload = { userId: user.id, email: user.email, username: user.username };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      throw new AppError('Account has been suspended', 403);
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokenPayload = { userId: user.id, email: user.email, username: user.username };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        lastLoginAt: new Date(),
      },
    });

    const { passwordHash, refreshToken: rt, twoFactorSecret, twoFactorBackupCodes, emailVerificationToken, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
      requiresTwoFactor: user.twoFactorEnabled,
    };
  }

  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        emailVerified: true,
        twoFactorEnabled: true,
        status: true,
        privacy: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async refreshToken(token: string) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || user.refreshToken !== token) {
        throw new AppError('Invalid refresh token', 401);
      }

      const tokenPayload = { userId: user.id, email: user.email, username: user.username };
      const accessToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new AppError('Invalid verification token', 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const resetToken = generateVerificationToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: resetToken },
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerificationToken: null,
      },
    });
  }

  async enableTwoFactor(userId: string) {
    const speakeasy = require('speakeasy');
    const secret = speakeasy.generateSecret({ length: 20, name: 'VANZHUB' });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  async verifyTwoFactor(userId: string, token: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new AppError('Two-factor authentication not set up', 400);
    }

    const speakeasy = require('speakeasy');
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      throw new AppError('Invalid two-factor token', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  async disableTwoFactor(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });
  }
}
