import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from './index';
import prisma from './database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

const onlineUsers = new Map<string, string>();

export const setupSocketHandlers = (io: SocketServer): void => {
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    try {
      const decoded = jwt.verify(token as string, config.jwt.secret) as any;
      socket.userId = decoded.userId;
      socket.username = decoded.username;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId) return;

    socket.join(`user:${userId}`);
    onlineUsers.set(userId, socket.id);
    io.emit('user:online', { userId });

    socket.on('typing:start', ({ receiverId }: { receiverId: string }) => {
      io.to(`user:${receiverId}`).emit('typing:start', { userId });
    });

    socket.on('typing:stop', ({ receiverId }: { receiverId: string }) => {
      io.to(`user:${receiverId}`).emit('typing:stop', { userId });
    });

    socket.on('message:send', async (data) => {
      try {
        const message = await prisma.message.create({
          data: {
            senderId: userId,
            receiverId: data.receiverId,
            content: data.content || null,
            type: data.type || 'TEXT',
            fileUrl: data.fileUrl || null,
            fileName: data.fileName || null,
            fileSize: data.fileSize || null,
          },
          include: {
            sender: { select: { id: true, username: true, displayName: true, avatar: true } },
          },
        });

        io.to(`user:${data.receiverId}`).emit('message:new', message);
        socket.emit('message:sent', message);
      } catch (error) {
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });

    socket.on('message:read', async ({ messageId, senderId }: { messageId: string; senderId: string }) => {
      await prisma.message.update({
        where: { id: messageId },
        data: { isRead: true, readAt: new Date() },
      });
      io.to(`user:${senderId}`).emit('message:read', { messageId, readBy: userId });
    });

    socket.on('notification:send', ({ targetUserId, notification }: { targetUserId: string; notification: any }) => {
      io.to(`user:${targetUserId}`).emit('notification:new', notification);
    });

    socket.on('post:reaction', async (data) => {
      io.to(`user:${data.postAuthorId}`).emit('post:reacted', {
        postId: data.postId,
        userId,
        type: data.type,
      });
    });

    socket.on('post:comment', async (data) => {
      io.to(`user:${data.postAuthorId}`).emit('post:commented', {
        postId: data.postId,
        userId,
        comment: data.comment,
      });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user:offline', { userId });
      socket.leave(`user:${userId}`);
    });
  });
};

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}
