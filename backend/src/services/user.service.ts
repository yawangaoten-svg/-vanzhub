import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { paginate, paginatedResponse } from '../utils/helpers';

interface PaginationOptions {
  page: number;
  limit: number;
}

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        privacy: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
            friendshipsSent: { where: { status: 'ACCEPTED' } },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateProfile(targetId: string, requesterId: string, data: any) {
    if (targetId !== requesterId) {
      throw new AppError('Not authorized to update this profile', 403);
    }

    const allowedFields = ['displayName', 'bio', 'location', 'website', 'privacy', 'dateOfBirth'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatar: true,
        coverPhoto: true,
        location: true,
        website: true,
        privacy: true,
      },
    });

    return user;
  }

  async searchUsers(query: string, pagination: PaginationOptions) {
    const { skip, take, page, limit } = paginate(pagination.page, pagination.limit);

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
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          _count: { select: { followers: true, following: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(users, total, page, limit);
  }

  async getSuggestions(userId: string) {
    const following = await prisma.follower.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId);

    const suggestions = await prisma.user.findMany({
      where: {
        id: { notIn: followingIds },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        _count: { select: { followers: true } },
      },
      take: 10,
      orderBy: { lastActivityAt: 'desc' },
    });

    return suggestions;
  }

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError('Cannot follow yourself', 400);
    }

    const existing = await prisma.follower.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      throw new AppError('Already following this user', 409);
    }

    await prisma.follower.create({
      data: { followerId, followingId },
    });
  }

  async unfollowUser(followerId: string, followingId: string) {
    const existing = await prisma.follower.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (!existing) {
      throw new AppError('Not following this user', 404);
    }

    await prisma.follower.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
  }

  async getFollowers(userId: string, pagination: PaginationOptions) {
    const { skip, take, page, limit } = paginate(pagination.page, pagination.limit);

    const [followers, total] = await Promise.all([
      prisma.follower.findMany({
        where: { followingId: userId },
        select: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          createdAt: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follower.count({ where: { followingId: userId } }),
    ]);

    return paginatedResponse(followers, total, page, limit);
  }

  async getFollowing(userId: string, pagination: PaginationOptions) {
    const { skip, take, page, limit } = paginate(pagination.page, pagination.limit);

    const [following, total] = await Promise.all([
      prisma.follower.findMany({
        where: { followerId: userId },
        select: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          createdAt: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follower.count({ where: { followerId: userId } }),
    ]);

    return paginatedResponse(following, total, page, limit);
  }

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new AppError('Cannot send friend request to yourself', 400);
    }

    const existing = await prisma.friendship.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });

    if (existing) {
      throw new AppError('Friend request already exists', 409);
    }

    const reverse = await prisma.friendship.findUnique({
      where: { senderId_receiverId: { senderId: receiverId, receiverId: senderId } },
    });

    if (reverse) {
      if (reverse.status === 'ACCEPTED') {
        throw new AppError('Already friends', 409);
      }
      await prisma.friendship.update({
        where: { id: reverse.id },
        data: { status: 'ACCEPTED' },
      });
      return;
    }

    await prisma.friendship.create({
      data: { senderId, receiverId, status: 'PENDING' },
    });
  }

  async respondToFriendRequest(userId: string, requesterId: string, status: 'ACCEPTED' | 'BLOCKED') {
    const friendship = await prisma.friendship.findFirst({
      where: {
        senderId: requesterId,
        receiverId: userId,
        status: 'PENDING',
      },
    });

    if (!friendship) {
      throw new AppError('Friend request not found', 404);
    }

    await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status },
    });
  }

  async removeFriend(userId: string, friendId: string) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
        status: 'ACCEPTED',
      },
    });

    if (!friendship) {
      throw new AppError('Friendship not found', 404);
    }

    await prisma.friendship.delete({ where: { id: friendship.id } });
  }

  async getFriends(userId: string, pagination: PaginationOptions) {
    const { skip, take, page, limit } = paginate(pagination.page, pagination.limit);

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
      select: {
        sender: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        receiver: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
      skip,
      take,
      orderBy: { updatedAt: 'desc' },
    });

    const friends = friendships.map(f =>
      f.sender.id === userId ? f.receiver : f.sender
    );

    const total = await prisma.friendship.count({
      where: {
        OR: [
          { senderId: userId, status: 'ACCEPTED' },
          { receiverId: userId, status: 'ACCEPTED' },
        ],
      },
    });

    return paginatedResponse(friends, total, page, limit);
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const avatarUrl = `/uploads/${file.filename}`;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: { id: true, avatar: true },
    });
    return user;
  }

  async updateCoverPhoto(userId: string, file: Express.Multer.File) {
    const coverUrl = `/uploads/${file.filename}`;
    const user = await prisma.user.update({
      where: { id: userId },
      data: { coverPhoto: coverUrl },
      select: { id: true, coverPhoto: true },
    });
    return user;
  }

  async getUserPosts(userId: string, pagination: PaginationOptions) {
    const { skip, take, page, limit } = paginate(pagination.page, pagination.limit);

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: userId, isDraft: false, isScheduled: false },
        include: {
          media: true,
          _count: { select: { comments: true, reactions: true } },
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where: { authorId: userId, isDraft: false, isScheduled: false } }),
    ]);

    return paginatedResponse(posts, total, page, limit);
  }

  async getUserMedia(userId: string, pagination: PaginationOptions) {
    const { skip, take, page, limit } = paginate(pagination.page, pagination.limit);

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.media.count({ where: { userId } }),
    ]);

    return paginatedResponse(media, total, page, limit);
  }
}
