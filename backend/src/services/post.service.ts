import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { paginate, paginatedResponse, extractHashtags, extractMentions } from '../utils/helpers';

interface PaginationOptions {
  page: number;
  limit: number;
}

export class PostService {
  async getFeed(userId: string, pagination: PaginationOptions) {
    const { skip, take, page, limit } = paginate(pagination.page, pagination.limit);

    const following = await prisma.follower.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId);

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          authorId: { in: followingIds },
          isDraft: false,
          isScheduled: false,
        },
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
          media: true,
          _count: {
            select: { comments: true, reactions: true, bookmarks: true },
          },
          reactions: {
            where: { authorId: userId },
            select: { type: true },
          },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({
        where: {
          authorId: { in: followingIds },
          isDraft: false,
          isScheduled: false,
        },
      }),
    ]);

    return paginatedResponse(posts, total, page, limit);
  }

  async createPost(userId: string, data: any) {
    const hashtags = data.content ? extractHashtags(data.content) : [];
    const mentions = data.content ? extractMentions(data.content) : [];

    const post = await prisma.post.create({
      data: {
        content: data.content,
        authorId: userId,
        isDraft: data.isDraft || false,
        isScheduled: data.isScheduled || false,
        scheduledAt: data.scheduledAt || null,
        media: data.mediaIds
          ? { connect: data.mediaIds.map((id: string) => ({ id })) }
          : undefined,
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
        mentions: mentions.length > 0
          ? {
              create: (await Promise.all(
                mentions.map(async (username) => {
                  const user = await prisma.user.findUnique({ where: { username } });
                  return user ? { userId: user.id } : null;
                })
              )).filter(Boolean) as any[]
            }
          : undefined,
        polls: data.poll
          ? {
              create: {
                question: data.poll.question,
                expiresAt: data.poll.expiresAt || null,
                options: {
                  create: data.poll.options.map((opt: string) => ({ text: opt })),
                },
              },
            }
          : undefined,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        media: true,
        hashtags: { include: { hashtag: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    });

    return post;
  }

  async getPost(postId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        media: true,
        hashtags: { include: { hashtag: true } },
        polls: {
          include: {
            options: true,
          },
        },
        _count: { select: { comments: true, reactions: true, bookmarks: true } },
      },
    });

    if (!post) {
      throw new AppError('Post not found', 404);
    }

    await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });

    return post;
  }

  async updatePost(postId: string, userId: string, data: any) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post not found', 404);
    if (post.authorId !== userId) throw new AppError('Not authorized', 403);

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        content: data.content,
        isEdited: true,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        media: true,
      },
    });

    return updated;
  }

  async deletePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post not found', 404);
    if (post.authorId !== userId) throw new AppError('Not authorized', 403);

    await prisma.post.delete({ where: { id: postId } });
  }

  async getDrafts(userId: string, pagination: PaginationOptions) {
    const { skip, take, page, limit } = paginate(pagination.page, pagination.limit);

    const [drafts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: userId, isDraft: true },
        include: {
          media: true,
          _count: { select: { comments: true, reactions: true } },
        },
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.post.count({ where: { authorId: userId, isDraft: true } }),
    ]);

    return paginatedResponse(drafts, total, page, limit);
  }

  async toggleReaction(userId: string, postId: string, type: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post not found', 404);

    const existing = await prisma.reaction.findFirst({
      where: { authorId: userId, postId, type: type as any },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return { reacted: false, type: null };
    }

    await prisma.reaction.create({
      data: { authorId: userId, postId, type: type as any },
    });

    return { reacted: true, type };
  }

  async toggleBookmark(userId: string, postId: string) {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }

    await prisma.bookmark.create({ data: { userId, postId } });
    return { bookmarked: true };
  }

  async getComments(postId: string, pagination: PaginationOptions) {
    const { skip, take, page, limit } = paginate(pagination.page, pagination.limit);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId, parentId: null },
        include: {
          author: {
            select: { id: true, username: true, displayName: true, avatar: true },
          },
          replies: {
            include: {
              author: {
                select: { id: true, username: true, displayName: true, avatar: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          _count: { select: { replies: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({ where: { postId, parentId: null } }),
    ]);

    return paginatedResponse(comments, total, page, limit);
  }

  async createComment(userId: string, postId: string, data: any) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new AppError('Post not found', 404);

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        authorId: userId,
        postId,
        parentId: data.parentId || null,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
    });

    return comment;
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError('Comment not found', 404);
    if (comment.authorId !== userId) throw new AppError('Not authorized', 403);

    await prisma.comment.delete({ where: { id: commentId } });
  }

  async getReactions(postId: string) {
    const reactions = await prisma.reaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: true,
    });

    return reactions.map(r => ({
      type: r.type,
      count: r._count,
    }));
  }

  async getTrendingHashtags() {
    const hashtags = await prisma.hashtag.findMany({
      orderBy: { count: 'desc' },
      take: 20,
    });
    return hashtags;
  }
}
