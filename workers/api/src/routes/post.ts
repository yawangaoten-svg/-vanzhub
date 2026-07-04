import { Hono } from 'hono';
import { Env } from '../config';
import { getPrisma } from '../database';
import { AppError } from '../error-handler';
import { authenticate } from '../auth-middleware';
import { paginate, paginatedResponse, extractHashtags, extractMentions } from '../helpers';

const router = new Hono<{ Bindings: Env; Variables: { user: any } }>();

router.get('/feed', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const { skip, take } = paginate(page, limit);

  const following = await prisma.follower.findMany({
    where: { followerId: user.userId },
    select: { followingId: true },
  });
  const followingIds = following.map(f => f.followingId);
  followingIds.push(user.userId);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: { in: followingIds }, isDraft: false, isScheduled: false },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        media: true,
        _count: { select: { comments: true, reactions: true, bookmarks: true } },
        reactions: { where: { authorId: user.userId }, select: { type: true } },
      },
      skip, take, orderBy: { createdAt: 'desc' },
    }),
    prisma.post.count({ where: { authorId: { in: followingIds }, isDraft: false, isScheduled: false } }),
  ]);

  return c.json({ status: 'success', ...paginatedResponse(posts, total, page, limit) });
});

router.post('/', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const data = await c.req.json();

  const hashtags = data.content ? extractHashtags(data.content) : [];
  const mentions = data.content ? extractMentions(data.content) : [];

  const post = await prisma.post.create({
    data: {
      content: data.content,
      authorId: user.userId,
      isDraft: data.isDraft || false,
      isScheduled: data.isScheduled || false,
      scheduledAt: data.scheduledAt || null,
      media: data.mediaIds ? { connect: data.mediaIds.map((id: string) => ({ id })) } : undefined,
      hashtags: {
        create: await Promise.all(
          hashtags.map(async (tag) => {
            const hashtag = await prisma.hashtag.upsert({
              where: { name: tag },
              update: { count: { increment: 1 } },
              create: { name: tag, count: 1 },
            });
            return { hashtagId: hashtag.id };
          })
        ),
      },
      mentions: mentions.length > 0 ? {
        create: (await Promise.all(
          mentions.map(async (username) => {
            const mentionedUser = await prisma.user.findUnique({ where: { username } });
            return mentionedUser ? { userId: mentionedUser.id } : null;
          })
        )).filter(Boolean) as any[],
      } : undefined,
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatar: true } },
      media: true,
      hashtags: { include: { hashtag: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });

  return c.json({ status: 'success', data: post }, 201);
});

router.get('/drafts', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const { skip, take } = paginate(page, limit);

  const [drafts, total] = await Promise.all([
    prisma.post.findMany({
      where: { authorId: user.userId, isDraft: true },
      include: { media: true, _count: { select: { comments: true, reactions: true } } },
      skip, take, orderBy: { updatedAt: 'desc' },
    }),
    prisma.post.count({ where: { authorId: user.userId, isDraft: true } }),
  ]);

  return c.json({ status: 'success', ...paginatedResponse(drafts, total, page, limit) });
});

router.get('/trending', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const hashtags = await prisma.hashtag.findMany({ orderBy: { count: 'desc' }, take: 20 });
  return c.json({ status: 'success', data: hashtags });
});

router.get('/:id', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const post = await prisma.post.findUnique({
    where: { id: c.req.param('id') },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatar: true } },
      media: true,
      hashtags: { include: { hashtag: true } },
      polls: { include: { options: true } },
      _count: { select: { comments: true, reactions: true, bookmarks: true } },
    },
  });
  if (!post) throw new AppError('Post not found', 404);

  await prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } });
  return c.json({ status: 'success', data: post });
});

router.patch('/:id', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const post = await prisma.post.findUnique({ where: { id: c.req.param('id') } });
  if (!post) throw new AppError('Post not found', 404);
  if (post.authorId !== user.userId) throw new AppError('Not authorized', 403);

  const data = await c.req.json();
  const updated = await prisma.post.update({
    where: { id: c.req.param('id') },
    data: { content: data.content, isEdited: true },
    include: { author: { select: { id: true, username: true, displayName: true, avatar: true } }, media: true },
  });
  return c.json({ status: 'success', data: updated });
});

router.delete('/:id', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const post = await prisma.post.findUnique({ where: { id: c.req.param('id') } });
  if (!post) throw new AppError('Post not found', 404);
  if (post.authorId !== user.userId) throw new AppError('Not authorized', 403);
  await prisma.post.delete({ where: { id: c.req.param('id') } });
  return c.json({ status: 'success', message: 'Post deleted' });
});

router.post('/:id/like', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const { type } = await c.req.json();
  const postId = c.req.param('id');

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new AppError('Post not found', 404);

  const existing = await prisma.reaction.findFirst({ where: { authorId: user.userId, postId, type: type as any } });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return c.json({ status: 'success', data: { reacted: false, type: null } });
  }

  await prisma.reaction.create({ data: { authorId: user.userId, postId, type: type as any } });
  return c.json({ status: 'success', data: { reacted: true, type } });
});

router.post('/:id/bookmark', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const postId = c.req.param('id');

  const existing = await prisma.bookmark.findUnique({ where: { userId_postId: { userId: user.userId, postId } } });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    return c.json({ status: 'success', data: { bookmarked: false } });
  }
  await prisma.bookmark.create({ data: { userId: user.userId, postId } });
  return c.json({ status: 'success', data: { bookmarked: true } });
});

router.get('/:id/comments', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const { skip, take } = paginate(page, limit);

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { postId: c.req.param('id'), parentId: null },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatar: true } },
        replies: { include: { author: { select: { id: true, username: true, displayName: true, avatar: true } } }, orderBy: { createdAt: 'asc' } },
        _count: { select: { replies: true } },
      },
      skip, take, orderBy: { createdAt: 'desc' },
    }),
    prisma.comment.count({ where: { postId: c.req.param('id'), parentId: null } }),
  ]);

  return c.json({ status: 'success', ...paginatedResponse(comments, total, page, limit) });
});

router.post('/:id/comments', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const data = await c.req.json();

  const comment = await prisma.comment.create({
    data: { content: data.content, authorId: user.userId, postId: c.req.param('id'), parentId: data.parentId || null },
    include: { author: { select: { id: true, username: true, displayName: true, avatar: true } } },
  });
  return c.json({ status: 'success', data: comment }, 201);
});

router.delete('/comments/:commentId', authenticate, async (c) => {
  const user = c.get('user');
  const prisma = getPrisma(c.env.DATABASE_URL);
  const comment = await prisma.comment.findUnique({ where: { id: c.req.param('commentId') } });
  if (!comment) throw new AppError('Comment not found', 404);
  if (comment.authorId !== user.userId) throw new AppError('Not authorized', 403);
  await prisma.comment.delete({ where: { id: c.req.param('commentId') } });
  return c.json({ status: 'success', message: 'Comment deleted' });
});

router.get('/:id/reactions', async (c) => {
  const prisma = getPrisma(c.env.DATABASE_URL);
  const reactions = await prisma.reaction.groupBy({
    by: ['type'],
    where: { postId: c.req.param('id') },
    _count: true,
  });
  const data = reactions.map(r => ({ type: r.type, count: r._count }));
  return c.json({ status: 'success', data });
});

export default router;
