import { Hono } from 'hono';
import { Env } from '../config';
import { getPrisma } from '../database';
import { authenticate } from '../auth-middleware';

const router = new Hono<{ Bindings: Env; Variables: { user: any } }>();

router.get('/', authenticate, async (c) => {
  const query = c.req.query('q') || '';
  if (!query) return c.json({ status: 'success', data: { users: [], posts: [], hashtags: [] } });

  const prisma = getPrisma(c.env.DATABASE_URL);
  const limit = parseInt(c.req.query('limit') || '10');

  const [users, posts, hashtags] = await Promise.all([
    prisma.user.findMany({
      where: { OR: [{ username: { contains: query, mode: 'insensitive' as any } }, { displayName: { contains: query, mode: 'insensitive' as any } }], status: 'ACTIVE' },
      select: { id: true, username: true, displayName: true, avatar: true, bio: true },
      take: limit,
    }),
    prisma.post.findMany({
      where: { content: { contains: query, mode: 'insensitive' as any }, isDraft: false },
      include: { author: { select: { id: true, username: true, displayName: true, avatar: true } }, media: true, _count: { select: { comments: true, reactions: true } } },
      take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.hashtag.findMany({
      where: { name: { contains: query.toLowerCase() } },
      orderBy: { count: 'desc' }, take: limit,
    }),
  ]);

  return c.json({ status: 'success', data: { users, posts, hashtags } });
});

router.get('/users', authenticate, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const query = c.req.query('q') || '';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const skip = (page - 1) * limit;

  const where = query
    ? { OR: [{ username: { contains: query, mode: 'insensitive' as any } }, { displayName: { contains: query, mode: 'insensitive' as any } }], status: 'ACTIVE' as const }
    : { status: 'ACTIVE' as const };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, select: { id: true, username: true, displayName: true, avatar: true, bio: true } }),
    prisma.user.count({ where }),
  ]);

  return c.json({ status: 'success', data: users, pagination: { total, page, limit } });
});

router.get('/posts', authenticate, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const query = c.req.query('q') || '';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const skip = (page - 1) * limit;

  const where = query ? { content: { contains: query, mode: 'insensitive' as any }, isDraft: false } : { isDraft: false };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: { author: { select: { id: true, username: true, displayName: true, avatar: true } }, media: true, _count: { select: { comments: true, reactions: true } } },
      skip, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.post.count({ where }),
  ]);

  return c.json({ status: 'success', data: posts, pagination: { total, page, limit } });
});

router.get('/hashtags', authenticate, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const query = c.req.query('q') || '';
  const hashtags = await prisma.hashtag.findMany({
    where: query ? { name: { contains: query.toLowerCase() } } : {},
    orderBy: { count: 'desc' }, take: 20,
  });
  return c.json({ status: 'success', data: hashtags });
});

router.get('/photos', authenticate, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const skip = (page - 1) * limit;

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where: { type: { startsWith: 'image/' } },
      include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
      skip, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.media.count({ where: { type: { startsWith: 'image/' } } }),
  ]);

  return c.json({ status: 'success', data: media, pagination: { total, page, limit } });
});

router.get('/videos', authenticate, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const skip = (page - 1) * limit;

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where: { type: { startsWith: 'video/' } },
      include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
      skip, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.media.count({ where: { type: { startsWith: 'video/' } } }),
  ]);

  return c.json({ status: 'success', data: media, pagination: { total, page, limit } });
});

router.get('/groups', authenticate, async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const query = c.req.query('q') || '';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const skip = (page - 1) * limit;

  const where = query ? { name: { contains: query, mode: 'insensitive' as any }, visibility: 'PUBLIC' as const } : { visibility: 'PUBLIC' as const };

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      include: { _count: { select: { members: true } }, owner: { select: { id: true, username: true } } },
      skip, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.group.count({ where }),
  ]);

  return c.json({ status: 'success', data: groups, pagination: { total, page, limit } });
});

export default router;
