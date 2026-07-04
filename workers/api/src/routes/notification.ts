import { Hono } from 'hono';
import { Env } from '../config';
import { getPrisma } from '../database';
import { authenticate } from '../auth-middleware';

const router = new Hono<{ Bindings: Env; Variables: { user: any } }>();

router.get('/', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.userId },
      include: { actor: { select: { id: true, username: true, displayName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
    }),
    prisma.notification.count({ where: { userId: user.userId } }),
  ]);

  return c.json({
    status: 'success', data: notifications,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

router.get('/unread-count', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const count = await prisma.notification.count({ where: { userId: user.userId, isRead: false } });
  return c.json({ status: 'success', data: { count } });
});

router.patch('/:id/read', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  await prisma.notification.updateMany({
    where: { id: c.req.param('id'), userId: user.userId },
    data: { isRead: true },
  });
  return c.json({ status: 'success', message: 'Marked as read' });
});

router.patch('/read-all', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  await prisma.notification.updateMany({
    where: { userId: user.userId, isRead: false },
    data: { isRead: true },
  });
  return c.json({ status: 'success', message: 'All marked as read' });
});

export default router;
