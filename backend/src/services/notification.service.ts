import prisma from '../config/database';

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  image?: string;
  actorId?: string;
}

export class NotificationService {
  async create(input: CreateNotificationInput) {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type as any,
        title: input.title,
        body: input.body || null,
        link: input.link || null,
        image: input.image || null,
        actorId: input.actorId || null,
      },
      include: {
        actor: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });
    return notification;
  }

  async getUserNotifications(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        include: {
          actor: { select: { id: true, username: true, displayName: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      data: notifications,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markAsRead(notificationId: string, userId: string) {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async createLikeNotification(postId: string, actorId: string, postAuthorId: string) {
    if (actorId === postAuthorId) return;

    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { displayName: true },
    });

    await this.create({
      userId: postAuthorId,
      type: 'LIKE',
      title: 'liked your post',
      body: '',
      link: `/posts/${postId}`,
      actorId,
    });
  }

  async createCommentNotification(postId: string, actorId: string, postAuthorId: string) {
    if (actorId === postAuthorId) return;

    await this.create({
      userId: postAuthorId,
      type: 'COMMENT',
      title: 'commented on your post',
      body: '',
      link: `/posts/${postId}`,
      actorId,
    });
  }

  async createFollowNotification(actorId: string, targetUserId: string) {
    if (actorId === targetUserId) return;

    await this.create({
      userId: targetUserId,
      type: 'FOLLOW',
      title: 'started following you',
      body: '',
      link: `/profile/${actorId}`,
      actorId,
    });
  }

  async createFriendRequestNotification(actorId: string, targetUserId: string) {
    if (actorId === targetUserId) return;

    await this.create({
      userId: targetUserId,
      type: 'FRIEND_REQUEST',
      title: 'sent you a friend request',
      body: '',
      link: `/friends`,
      actorId,
    });
  }

  async createMentionNotification(actorId: string, targetUserId: string, postId: string) {
    if (actorId === targetUserId) return;

    await this.create({
      userId: targetUserId,
      type: 'MENTION',
      title: 'mentioned you in a post',
      body: '',
      link: `/posts/${postId}`,
      actorId,
    });
  }
}
