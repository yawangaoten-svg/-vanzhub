import prisma from '../config/database';

export class AdminService {
  async getDashboard() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalGroups,
      totalMessages,
      activeToday,
      newUsers30d,
      newPosts30d,
      pendingReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.group.count(),
      prisma.message.count(),
      prisma.user.count({ where: { lastActivityAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.post.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      totalPosts,
      totalComments,
      totalGroups,
      totalMessages,
      activeUsersToday: activeToday,
      newUsersLast30Days: newUsers30d,
      newPostsLast30Days: newPosts30d,
      pendingReports,
    };
  }

  async getUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          status: true,
          emailVerified: true,
          twoFactorEnabled: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { posts: true, followers: true, following: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return { data: users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateUserStatus(userId: string, status: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
    });
  }

  async deleteUser(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'DELETED' },
    });
  }

  async getReports(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        include: {
          reporter: { select: { id: true, username: true, displayName: true } },
          reported: { select: { id: true, username: true, displayName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.report.count(),
    ]);

    return { data: reports, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateReportStatus(reportId: string, status: string, resolvedBy: string) {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status: status as any,
        resolvedAt: status === 'RESOLVED' || status === 'DISMISSED' ? new Date() : null,
        resolvedBy,
      },
    });
  }

  async getAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [userRegistrations, postsCreated, reactionsGiven, messagesSent, reportsFiled] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.post.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.reaction.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.message.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.report.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return {
      userRegistrations,
      postsCreated,
      reactionsGiven,
      messagesSent,
      reportsFiled,
      period: { from: thirtyDaysAgo, to: now },
    };
  }

  async getActivityLogs(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        include: { user: { select: { id: true, username: true, displayName: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count(),
    ]);

    return { data: logs, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
