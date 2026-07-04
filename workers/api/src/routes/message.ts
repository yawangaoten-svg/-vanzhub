import { Hono } from 'hono';
import { Env } from '../config';
import { getPrisma } from '../database';
import { AppError } from '../error-handler';
import { authenticate } from '../auth-middleware';

const router = new Hono<{ Bindings: Env; Variables: { user: any } }>();

router.get('/conversations', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const sentMessages = await prisma.message.findMany({
    where: { senderId: user.userId },
    select: { receiverId: true },
    distinct: ['receiverId'],
  });

  const receivedMessages = await prisma.message.findMany({
    where: { receiverId: user.userId },
    select: { senderId: true },
    distinct: ['senderId'],
  });

  const conversationUserIds = new Set([
    ...sentMessages.map(m => m.receiverId),
    ...receivedMessages.map(m => m.senderId),
  ]);

  const conversations = await Promise.all(
    Array.from(conversationUserIds).map(async (otherUserId) => {
      const [lastMessage, otherUser, unreadCount] = await Promise.all([
        prisma.message.findFirst({
          where: { OR: [{ senderId: user.userId, receiverId: otherUserId }, { senderId: otherUserId, receiverId: user.userId }] },
          orderBy: { createdAt: 'desc' },
          select: { content: true, type: true, createdAt: true, isRead: true },
        }),
        prisma.user.findUnique({
          where: { id: otherUserId },
          select: { id: true, username: true, displayName: true, avatar: true },
        }),
        prisma.message.count({ where: { senderId: otherUserId, receiverId: user.userId, isRead: false } }),
      ]);
      return { user: otherUser, lastMessage, unreadCount };
    })
  );

  conversations.sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
  });

  return c.json({ status: 'success', data: conversations });
});

router.get('/:userId', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const otherUserId = c.req.param('userId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { OR: [{ senderId: user.userId, receiverId: otherUserId }, { senderId: otherUserId, receiverId: user.userId }] },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.message.count({
      where: { OR: [{ senderId: user.userId, receiverId: otherUserId }, { senderId: otherUserId, receiverId: user.userId }] },
    }),
  ]);

  return c.json({
    status: 'success', data: messages.reverse(),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

router.post('/', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const { receiverId, content, type, fileUrl, fileName, fileSize, duration } = await c.req.json();

  const message = await prisma.message.create({
    data: {
      senderId: user.userId, receiverId, content: content || null,
      type: type || 'TEXT', fileUrl: fileUrl || null, fileName: fileName || null,
      fileSize: fileSize || null, duration: duration || null,
    },
    include: { sender: { select: { id: true, username: true, displayName: true, avatar: true } } },
  });

  return c.json({ status: 'success', data: message }, 201);
});

router.delete('/:id', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const message = await prisma.message.findUnique({ where: { id: c.req.param('id') } });
  if (!message) throw new AppError('Message not found', 404);
  if (message.senderId !== user.userId) throw new AppError('Not authorized', 403);

  await prisma.message.delete({ where: { id: c.req.param('id') } });
  return c.json({ status: 'success', message: 'Message deleted' });
});

router.post('/:id/read', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);

  await prisma.message.updateMany({
    where: { id: c.req.param('id'), receiverId: user.userId },
    data: { isRead: true, readAt: new Date() },
  });

  return c.json({ status: 'success', message: 'Marked as read' });
});

export default router;
