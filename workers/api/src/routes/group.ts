import { Hono } from 'hono';
import { Env } from '../config';
import { getPrisma } from '../database';
import { AppError } from '../error-handler';
import { authenticate } from '../auth-middleware';

const router = new Hono<{ Bindings: Env; Variables: { user: any } }>();

router.post('/', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const { name, description, visibility, inviteOnly } = await c.req.json();

  const group = await prisma.group.create({
    data: {
      name, description: description || null,
      visibility: visibility || 'PUBLIC', inviteOnly: inviteOnly || false,
      ownerId: user.userId,
      members: { create: { userId: user.userId, role: 'ADMIN' } },
    },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } } },
    },
  });

  return c.json({ status: 'success', data: group }, 201);
});

router.get('/', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const skip = (page - 1) * limit;

  const memberGroups = await prisma.groupMember.findMany({
    where: { userId: user.userId },
    select: { groupId: true },
  });
  const groupIds = memberGroups.map(m => m.groupId);

  const where = c.req.query('mine') === 'true'
    ? { id: { in: groupIds } }
    : { visibility: 'PUBLIC' as const };

  const [groups, total] = await Promise.all([
    prisma.group.findMany({
      where,
      include: {
        _count: { select: { members: true } },
        owner: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
      skip, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.group.count({ where }),
  ]);

  return c.json({
    status: 'success', data: groups,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

router.get('/:id', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const group = await prisma.group.findUnique({
    where: { id: c.req.param('id') },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } } },
      owner: { select: { id: true, username: true, displayName: true, avatar: true } },
      _count: { select: { members: true, messages: true } },
    },
  });
  if (!group) throw new AppError('Group not found', 404);
  return c.json({ status: 'success', data: group });
});

router.patch('/:id', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const group = await prisma.group.findUnique({ where: { id: c.req.param('id') } });
  if (!group) throw new AppError('Group not found', 404);
  if (group.ownerId !== user.userId) throw new AppError('Not authorized', 403);

  const data = await c.req.json();
  const updated = await prisma.group.update({ where: { id: c.req.param('id') }, data });
  return c.json({ status: 'success', data: updated });
});

router.delete('/:id', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const group = await prisma.group.findUnique({ where: { id: c.req.param('id') } });
  if (!group) throw new AppError('Group not found', 404);
  if (group.ownerId !== user.userId) throw new AppError('Not authorized', 403);
  await prisma.group.delete({ where: { id: c.req.param('id') } });
  return c.json({ status: 'success', message: 'Group deleted' });
});

router.post('/:id/join', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const group = await prisma.group.findUnique({ where: { id: c.req.param('id') } });
  if (!group) throw new AppError('Group not found', 404);
  if (group.visibility === 'PRIVATE') throw new AppError('This is a private group', 403);

  const existing = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.userId, groupId: c.req.param('id') } },
  });
  if (existing) throw new AppError('Already a member', 409);

  await prisma.groupMember.create({ data: { userId: user.userId, groupId: c.req.param('id') } });
  return c.json({ status: 'success', message: 'Joined group' });
});

router.post('/:id/leave', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.userId, groupId: c.req.param('id') } },
  });
  if (!membership) throw new AppError('Not a member', 404);
  await prisma.groupMember.delete({ where: { id: membership.id } });
  return c.json({ status: 'success', message: 'Left group' });
});

router.post('/:id/members/:userId', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const group = await prisma.group.findUnique({ where: { id: c.req.param('id') } });
  if (!group) throw new AppError('Group not found', 404);
  if (group.ownerId !== user.userId) throw new AppError('Not authorized', 403);

  await prisma.groupMember.create({ data: { userId: c.req.param('userId'), groupId: c.req.param('id') } });
  return c.json({ status: 'success', message: 'Member added' });
});

router.delete('/:id/members/:userId', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const group = await prisma.group.findUnique({ where: { id: c.req.param('id') } });
  if (!group) throw new AppError('Group not found', 404);
  if (group.ownerId !== user.userId) throw new AppError('Not authorized', 403);

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: c.req.param('userId'), groupId: c.req.param('id') } },
  });
  if (!membership) throw new AppError('Member not found', 404);
  await prisma.groupMember.delete({ where: { id: membership.id } });
  return c.json({ status: 'success', message: 'Member removed' });
});

router.patch('/:id/members/:userId/role', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const group = await prisma.group.findUnique({ where: { id: c.req.param('id') } });
  if (!group) throw new AppError('Group not found', 404);
  if (group.ownerId !== user.userId) throw new AppError('Not authorized', 403);

  const { role } = await c.req.json();
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: c.req.param('userId'), groupId: c.req.param('id') } },
  });
  if (!membership) throw new AppError('Member not found', 404);

  await prisma.groupMember.update({ where: { id: membership.id }, data: { role: role as any } });
  return c.json({ status: 'success', message: 'Role updated' });
});

export default router;
