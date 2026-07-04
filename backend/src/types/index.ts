import { Request } from 'express';

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface SearchQuery extends PaginationQuery {
  q?: string;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
}

export interface SocketAuthPayload {
  userId: string;
  username: string;
}
