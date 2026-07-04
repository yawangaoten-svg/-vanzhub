import prisma from '../config/database';

export class SearchService {
  async searchAll(query: string, limit = 10) {
    const [users, posts, hashtags] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' as any } },
            { displayName: { contains: query, mode: 'insensitive' as any } },
          ],
          status: 'ACTIVE',
        },
        select: { id: true, username: true, displayName: true, avatar: true, bio: true },
        take: limit,
      }),
      prisma.post.findMany({
        where: {
          content: { contains: query, mode: 'insensitive' as any },
          isDraft: false,
          isScheduled: false,
        },
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true } },
          media: true,
          _count: { select: { comments: true, reactions: true } },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.hashtag.findMany({
        where: { name: { contains: query.toLowerCase() } },
        orderBy: { count: 'desc' },
        take: limit,
      }),
    ]);

    return { users, posts, hashtags };
  }

  async searchUsers(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const where = query
      ? {
          OR: [
            { username: { contains: query, mode: 'insensitive' as any } },
            { displayName: { contains: query, mode: 'insensitive' as any } },
          ],
          status: 'ACTIVE' as const,
        }
      : { status: 'ACTIVE' as const };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, username: true, displayName: true, avatar: true, bio: true },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { data: users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async searchPosts(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const where = {
      content: { contains: query, mode: 'insensitive' as any },
      isDraft: false,
      isScheduled: false,
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatar: true } },
          media: true,
          _count: { select: { comments: true, reactions: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    return { data: posts, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async searchHashtags(query: string) {
    return prisma.hashtag.findMany({
      where: query ? { name: { contains: query.toLowerCase() } } : {},
      orderBy: { count: 'desc' },
      take: 20,
    });
  }

  async searchMedia(type: 'image' | 'video', page: number, limit: number) {
    const skip = (page - 1) * limit;
    const mimePrefix = type === 'image' ? 'image/' : 'video/';

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where: { type: { startsWith: mimePrefix } },
        include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.media.count({ where: { type: { startsWith: mimePrefix } } }),
    ]);

    return { data: media, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async searchGroups(query: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const where = query
      ? { name: { contains: query, mode: 'insensitive' as any }, visibility: 'PUBLIC' as const }
      : { visibility: 'PUBLIC' as const };

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        include: {
          _count: { select: { members: true } },
          owner: { select: { id: true, username: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.group.count({ where }),
    ]);

    return { data: groups, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
