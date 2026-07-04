import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface PaginationOptions {
  page: number;
  limit: number;
}

export class GroupService {
  async createGroup(userId: string, data: { name: string; description?: string; visibility?: string; inviteOnly?: boolean }) {
    const group = await prisma.group.create({
      data: {
        name: data.name,
        description: data.description || null,
        visibility: (data.visibility as any) || 'PUBLIC',
        inviteOnly: data.inviteOnly || false,
        ownerId: userId,
        members: {
          create: { userId, role: 'ADMIN' },
        },
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
        },
        owner: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });
    return group;
  }

  async getGroups(userId: string, pagination: PaginationOptions, mineOnly = false) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const memberGroupIds = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    const groupIds = memberGroupIds.map(m => m.groupId);

    const where = mineOnly
      ? { id: { in: groupIds } }
      : { visibility: 'PUBLIC' as const };

    const [groups, total] = await Promise.all([
      prisma.group.findMany({
        where,
        include: {
          _count: { select: { members: true, messages: true } },
          owner: { select: { id: true, username: true, displayName: true, avatar: true } },
          members: {
            where: { userId },
            select: { role: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.group.count({ where }),
    ]);

    return {
      data: groups,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getGroup(groupId: string) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        owner: { select: { id: true, username: true, displayName: true, avatar: true } },
        _count: { select: { members: true, messages: true } },
      },
    });
    if (!group) throw new AppError('Group not found', 404);
    return group;
  }

  async updateGroup(groupId: string, userId: string, data: any) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError('Group not found', 404);
    if (group.ownerId !== userId) throw new AppError('Only the owner can update this group', 403);

    return prisma.group.update({
      where: { id: groupId },
      data: {
        name: data.name,
        description: data.description,
        visibility: data.visibility,
        inviteOnly: data.inviteOnly,
        coverUrl: data.coverUrl,
      },
    });
  }

  async deleteGroup(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError('Group not found', 404);
    if (group.ownerId !== userId) throw new AppError('Only the owner can delete this group', 403);

    await prisma.group.delete({ where: { id: groupId } });
  }

  async joinGroup(groupId: string, userId: string) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError('Group not found', 404);
    if (group.visibility === 'PRIVATE') throw new AppError('This is a private group', 403);
    if (group.inviteOnly) throw new AppError('This group is invite-only', 403);

    const existing = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (existing) throw new AppError('Already a member', 409);

    return prisma.groupMember.create({ data: { userId, groupId } });
  }

  async leaveGroup(groupId: string, userId: string) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) throw new AppError('Not a member', 404);

    await prisma.groupMember.delete({ where: { id: membership.id } });
  }

  async addMember(groupId: string, userId: string, requesterId: string) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError('Group not found', 404);
    if (group.ownerId !== requesterId) throw new AppError('Only the owner can add members', 403);

    return prisma.groupMember.create({ data: { userId, groupId } });
  }

  async removeMember(groupId: string, userId: string, requesterId: string) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError('Group not found', 404);
    if (group.ownerId !== requesterId) throw new AppError('Only the owner can remove members', 403);

    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) throw new AppError('Member not found', 404);

    await prisma.groupMember.delete({ where: { id: membership.id } });
  }

  async updateMemberRole(groupId: string, userId: string, role: string, requesterId: string) {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new AppError('Group not found', 404);
    if (group.ownerId !== requesterId) throw new AppError('Only the owner can change roles', 403);

    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) throw new AppError('Member not found', 404);

    return prisma.groupMember.update({
      where: { id: membership.id },
      data: { role: role as any },
    });
  }
}
