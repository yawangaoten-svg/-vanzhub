import { DurableObject } from 'cloudflare:workers';

interface WebSocketClient {
  socket: WebSocket;
  userId: string;
  username: string;
}

export class WebSocketDO extends DurableObject {
  private clients: Map<string, WebSocketClient> = new Map();

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response('Missing token', { status: 401 });
    }

    try {
      const jwt = require('jsonwebtoken');
      const secret = (this.ctx as any).env?.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(token, secret) as any;

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      server.accept();

      this.clients.set(decoded.userId, { socket: server, userId: decoded.userId, username: decoded.username });

      server.addEventListener('message', async (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data as string);
          await this.handleMessage(decoded.userId, decoded.username, data);
        } catch (err) {
          server.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      server.addEventListener('close', () => {
        this.clients.delete(decoded.userId);
        this.broadcast({ type: 'user:offline', userId: decoded.userId }, decoded.userId);
      });

      this.broadcast({ type: 'user:online', userId: decoded.userId }, decoded.userId);
      server.send(JSON.stringify({ type: 'connected', userId: decoded.userId }));

      return new Response(null, { status: 101, webSocket: client });
    } catch {
      return new Response('Invalid token', { status: 401 });
    }
  }

  private async handleMessage(userId: string, username: string, data: any) {
    switch (data.type) {
      case 'typing:start':
      case 'typing:stop':
        this.sendToUser(data.receiverId, { type: data.type, userId });
        break;

      case 'message:send': {
        try {
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
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
          await prisma.$disconnect();

          this.sendToUser(data.receiverId, { type: 'message:new', message });
          this.sendToUser(userId, { type: 'message:sent', message });
        } catch (err: any) {
          this.sendToUser(userId, { type: 'message:error', error: 'Failed to send message' });
        }
        break;
      }

      case 'message:read':
        try {
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          await prisma.message.update({
            where: { id: data.messageId },
            data: { isRead: true, readAt: new Date() },
          });
          await prisma.$disconnect();
          this.sendToUser(data.senderId, { type: 'message:read', messageId: data.messageId, readBy: userId });
        } catch {}
        break;

      case 'notification:send':
        this.sendToUser(data.targetUserId, { type: 'notification:new', notification: data.notification });
        break;

      case 'post:reaction':
        this.sendToUser(data.postAuthorId, { type: 'post:reacted', postId: data.postId, userId, reactionType: data.type });
        break;

      case 'post:comment':
        this.sendToUser(data.postAuthorId, { type: 'post:commented', postId: data.postId, userId, comment: data.comment });
        break;
    }
  }

  private sendToUser(userId: string, data: any) {
    const client = this.clients.get(userId);
    if (client) {
      try {
        client.socket.send(JSON.stringify(data));
      } catch {}
    }
  }

  private broadcast(data: any, excludeUserId?: string) {
    for (const [id, client] of this.clients) {
      if (id !== excludeUserId) {
        try {
          client.socket.send(JSON.stringify(data));
        } catch {}
      }
    }
  }
}
