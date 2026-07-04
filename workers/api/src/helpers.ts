import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const generateToken = (payload: { userId: string; email: string; username: string }, secret: string, expiresIn: string): string => {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const generateRefreshToken = (payload: { userId: string; email: string; username: string }, secret: string, expiresIn: string): string => {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const verifyRefreshToken = (token: string, secret: string): any => {
  return jwt.verify(token, secret);
};

export const hashPassword = async (password: string, saltRounds: number): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateVerificationToken = (): string => uuidv4();

export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

export const extractHashtags = (text: string): string[] => {
  const regex = /#(\w+)/g;
  const matches = text.match(regex);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
};

export const extractMentions = (text: string): string[] => {
  const regex = /@(\w+)/g;
  const matches = text.match(regex);
  return matches ? matches.map(m => m.slice(1)) : [];
};

export const sanitizeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export function paginate(page: number = 1, limit: number = 20) {
  const skip = (page - 1) * limit;
  const take = limit;
  return { skip, take, page, limit };
}

export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}
