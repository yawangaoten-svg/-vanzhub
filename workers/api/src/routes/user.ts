import { Hono } from 'hono';
import { Env } from '../config';
import { getPrisma } from '../database';
import { AppError } from '../error-handler';
import { authenticate } from '../auth-middleware';
import { paginate, paginatedResponse } from '../helpers';

const router = new Hono<{ Bindings: Env; Variables: { user: any } }>();

router.get('/suggestions', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const following = await prisma.follower.findMany({
    where: { followerId: user.userId },
    select: { followingId: true },
  });
  const followingIds = following.map(f => f.followingId);
  followingIds.push(user.userId);

  const suggestions = await prisma.user.findMany({
    where: { id: { notIn: followingIds }, status: 'ACTIVE' },
    select: { id: true, username: true, displayName: true, avatar: true, bio: true, _count: { select: { followers: true } } },
    take: 10,
    orderBy: { lastActivityAt: 'desc' },
  });

  return c.json({ status: 'success', data: suggestions });
});

router.get('/:id', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const profile = await prisma.user.findUnique({
    where: { id: c.req.param('id') },
    select: {
      id: true, username: true, displayName: true, bio: true, avatar: true,
      coverPhoto: true, location: true, website: true, privacy: true, createdAt: true,
      _count: { select: { followers: true, following: true, posts: true, friendshipsSent: { where: { status: 'ACCEPTED' } } } },
    },
  });
  if (!profile) throw new AppError('User not found', 404);
  return c.json({ status: 'success', data: profile });
});

router.patch('/:id', authenticate, async (c) => {
  const user = c.get('user');
  if (c.req.param('id') !== user.userId) throw new AppError('Not authorized to update this profile', 403);

  const prisma = getPrisma(c.env.DATABASE_URL);
  const body = await c.req.json();
  const allowedFields = ['displayName', 'bio', 'location', 'website', 'privacy', 'dateOfBirth'];
  const updateData: any = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) updateData[field] = body[field];
  }

  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: updateData,
    select: { id: true, username: true, displayName: true, bio: true, avatar: true, coverPhoto: true, location: true, website: true, privacy: true },
  });
  return c.json({ status: 'success', data: updated });
});

router.post('/:id/follow', authenticate, async (c) => {
  const user = c.get('user');
  const targetId = c.req.param('id');
  if (user.userId === targetId) throw new AppError('Cannot follow yourself', 400);

  const prisma = getPrisma(c.env.DATABASE_URL);
  const existing = await prisma.follower.findUnique({
    where: { followerId_followingId: { followerId: user.userId, followingId: targetId } },
  });
  if (existing) throw new AppError('Already following this user', 409);

  await prisma.follower.create({ data: { followerId: user.userId, followingId: targetId } });
  return c.json({ status: 'success', message: 'Followed successfully' });
});

router.post('/:id/unfollow', authenticate, async (c) => {
  const user = c.get('user');
  const targetId = c.req.param('id');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const existing = await prisma.follower.findUnique({
    where: { followerId_followingId: { followerId: user.userId, followingId: targetId } },
  });
  if (!existing) throw new AppError('Not following this user', 404);

  await prisma.follower.delete({ where: { followerId_followingId: { followerId: user.userId, followingId: targetId } } });
  return c.json({ status: 'success', message: 'Unfollowed successfully' });
});

router.get('/:id/followers', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const { skip, take } = paginate(page, limit);

  const [followers, total] = await Promise.all([
    prisma.follower.findMany({
      where: { followingId: c.req.param('id') },
      select: { follower: { select: { id: true, username: true, displayName: true, avatar: true } }, createdAt: true },
      skip, take, orderBy: { createdAt: 'desc' },
    }),
    prisma.follower.count({ where: { followingId: c.req.param('id') } }),
  ]);

  return c.json({ status: 'success', ...paginatedResponse(followers, total, page, limit) });
});

router.get('/:id/following', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const { skip, take } = paginate(page, limit);

  const [following, total] = await Promise.all([
    prisma.follower.findMany({
      where: { followerId: c.req.param('id') },
      select: { following: { select: { id: true, username: true, displayName: true, avatar: true } }, createdAt: true },
      skip, take, orderBy: { createdAt: 'desc' },
    }),
    prisma.follower.count({ where: { followerId: c.req.param('id') } }),
  ]);

  return c.json({ status: 'success', ...paginatedResponse(following, total, page, limit) });
});

router.post('/:id/friend-request', authenticate, async (c) => {
  const user = c.get('user');
  const receiverId = c.req.param('id');
  if (user.userId === receiverId) throw new AppError('Cannot send friend request to yourself', 400);

  const prisma = getPrisma(c.env.DATABASE_URL);
  const existing = await prisma.friendship.findUnique({
    where: { senderId_receiverId: { senderId: user.userId, receiverId } },
  });
  if (existing) throw new AppError('Friend request already exists', 409);

  const reverse = await prisma.friendship.findUnique({
    where: { senderId_receiverId: { senderId: receiverId, receiverId: user.userId } },
  });
  if (reverse) {
    if (reverse.status === 'ACCEPTED') throw new AppError('Already friends', 409);
    await prisma.friendship.update({ where: { id: reverse.id }, data: { status: 'ACCEPTED' } });
    return c.json({ status: 'success', message: 'Friend request accepted' });
  }

  await prisma.friendship.create({ data: { senderId: user.userId, receiverId, status: 'PENDING' } });
  return c.json({ status: 'success', message: 'Friend request sent' });
});

router.post('/:id/accept-friend', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const friendship = await prisma.friendship.findFirst({
    where: { senderId: c.req.param('id'), receiverId: user.userId, status: 'PENDING' },
  });
  if (!friendship) throw new AppError('Friend request not found', 404);

  await prisma.friendship.update({ where: { id: friendship.id }, data: { status: 'ACCEPTED' } });
  return c.json({ status: 'success', message: 'Friend request accepted' });
});

router.post('/:id/reject-friend', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const friendship = await prisma.friendship.findFirst({
    where: { senderId: c.req.param('id'), receiverId: user.userId, status: 'PENDING' },
  });
  if (!friendship) throw new AppError('Friend request not found', 404);

  await prisma.friendship.update({ where: { id: friendship.id }, data: { status: 'BLOCKED' } });
  return c.json({ status: 'success', message: 'Friend request rejected' });
});

router.post('/:id/remove-friend', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { senderId: user.userId, receiverId: c.req.param('id') },
        { senderId: c.req.param('id'), receiverId: user.userId },
      ],
      status: 'ACCEPTED',
    },
  });
  if (!friendship) throw new AppError('Friendship not found', 404);

  await prisma.friendship.delete({ where: { id: friendship.id } });
  return c.json({ status: 'success', message: 'Friend removed' });
});

router.get('/:id/friends', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const { skip, take } = paginate(page, limit);

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { senderId: c.req.param('id'), status: 'ACCEPTED' },
        { receiverId: c.req.param('id'), status: 'ACCEPTED' },
      ],
    },
    select: {
      sender: { select: { id: true, username: true, displayName: true, avatar: true } },
      receiver: { select: { id: true, username: true, displayName: true, avatar: true } },
    },
    skip, take, orderBy: { updatedAt: 'desc' },
  });

  const friends = friendships.map(f =>
    f.sender.id === c.req.param('id') ? f.receiver : f.sender
  );

  const total = await prisma.friendship.count({
    where: {
      OR: [
        { senderId: c.req.param('id'), status: 'ACCEPTED' },
        { receiverId: c.req.param('id'), status: 'ACCEPTED' },
      ],
    },
  });

  return c.json({ status: 'success', ...paginatedResponse(friends, total, page, limit) });
});

router.post('/avatar', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const body = await c.req.parseBody();
  const file = body['image'] as File | undefined;

  if (!file) throw new AppError('No file uploaded', 400);

  const key = `avatars/${user.userId}-${Date.now()}`;
  await c.env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const avatarUrl = `https://api.vanzhub.com/uploads/${key}`;
  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: { avatar: avatarUrl },
    select: { id: true, avatar: true },
  });

  return c.json({ status: 'success', data: updated });
});

router.post('/cover', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const body = await c.req.parseBody();
  const file = body['cover'] as File | undefined;

  if (!file) throw new AppError('No file uploaded', 400);

  const key = `covers/${user.userId}-${Date.now()}`;
  await c.env.R2_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const coverUrl = `https://api.vanzhub.com/uploads/${key}`;
  const updated = await prisma.user.update({
    where: { id: user.userId },
    data: { coverPhoto: coverUrl },
    select: { id: true, coverPhoto: true },
  });

  return c.json({ status: 'success', data: updated });
});

router.get('/:id/posts', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const { skip, take } = paginate(page, limit);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: c.req.param('id'), isDraft: false, isScheduled: false },
      include: { media: true, _count: { select: { comments: true, reactions: true } } },
      skip, take, orderBy: { createdAt: 'desc' },
    }),
    prisma.post.count({ where: { authorId: c.req.param('id'), isDraft: false, isScheduled: false } }),
  ]);

  return c.json({ status: 'success', ...paginatedResponse(posts, total, page, limit) });
});

router.get('/:id/media', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const { skip, take } = paginate(page, limit);

  const [media, total] = await Promise.all([
    prisma.media.findMany({ where: { userId: c.req.param('id') }, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.media.count({ where: { userId: c.req.param('id') } }),
  ]);

  return c.json({ status: 'success', ...paginatedResponse(media, total, page, limit) });
});

export default router;
