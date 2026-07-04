import { Hono } from 'hono';
import { Env } from '../config';
import { getPrisma } from '../database';
import { AppError } from '../error-handler';
import { authenticate } from '../auth-middleware';

const router = new Hono<{ Bindings: Env; Variables: { user: any } }>();

const requireAdmin = async (c: any, next: any) => {
  const user = c.get('user');
  if (!user) throw new AppError('Authentication required', 401);
  if (user.email !== 'admin@vanzhub.com') throw new AppError('Admin access required', 403);
  await next();
};

router.use('*', authenticate, requireAdmin);

router.get('/dashboard', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [totalUsers, totalPosts, totalComments, totalGroups, totalMessages, activeToday, pendingReports] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
    prisma.group.count(),
    prisma.message.count(),
    prisma.user.count({ where: { lastActivityAt: { gte: todayStart } } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
  ]);

  return c.json({
    status: 'success',
    data: { totalUsers, totalPosts, totalComments, totalGroups, totalMessages, activeUsersToday: activeToday, pendingReports },
  });
});

router.get('/users', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, email: true, username: true, displayName: true, status: true, emailVerified: true, createdAt: true, lastLoginAt: true, _count: { select: { posts: true, followers: true } } },
      skip, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);

  return c.json({ status: 'success', data: users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

router.patch('/users/:userId/status', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const { status } = await c.req.json();
  await prisma.user.update({ where: { id: c.req.param('userId') }, data: { status } });
  return c.json({ status: 'success', message: 'User status updated' });
});

router.delete('/users/:userId', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  await prisma.user.update({ where: { id: c.req.param('userId') }, data: { status: 'DELETED' } });
  return c.json({ status: 'success', message: 'User deleted' });
});

router.get('/reports', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      include: { reporter: { select: { id: true, username: true } }, reported: { select: { id: true, username: true, displayName: true } } },
      skip, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.report.count(),
  ]);

  return c.json({ status: 'success', data: reports, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

router.patch('/reports/:reportId', async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const { status } = await c.req.json();
  await prisma.report.update({
    where: { id: c.req.param('reportId') },
    data: { status, resolvedAt: new Date(), resolvedBy: user.userId },
  });
  return c.json({ status: 'success', message: 'Report status updated' });
});

router.get('/analytics', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [userRegistrations, postCount, reactionCount, messageCount] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.post.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.reaction.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.message.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ]);

  return c.json({
    status: 'success',
    data: { userRegistrations, postCount, reactionCount, messageCount, period: { from: thirtyDaysAgo, to: now } },
  });
});

router.get('/activity-logs', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      include: { user: { select: { id: true, username: true } } },
      skip, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.activityLog.count(),
  ]);

  return c.json({ status: 'success', data: logs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } });
});

export default router;
