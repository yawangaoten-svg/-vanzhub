import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class GroupController {
  createGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, description, visibility, inviteOnly } = req.body;

      const group = await prisma.group.create({
        data: {
          name,
          description,
          visibility,
          inviteOnly: inviteOnly || false,
          ownerId: req.user!.userId,
          members: {
            create: { userId: req.user!.userId, role: 'ADMIN' },
          },
        },
        include: {
          members: {
            include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
          },
        },
      });

      res.status(201).json({ status: 'success', data: group });
    } catch (error) {
      next(error);
    }
  };

  getGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const memberGroups = await prisma.groupMember.findMany({
        where: { userId: req.user!.userId },
        select: { groupId: true },
      });
      const groupIds = memberGroups.map(m => m.groupId);

      const where = req.query.mine === 'true'
        ? { id: { in: groupIds } }
        : { visibility: 'PUBLIC' as const };

      const [groups, total] = await Promise.all([
        prisma.group.findMany({
          where,
          include: {
            _count: { select: { members: true } },
            owner: { select: { id: true, username: true, displayName: true, avatar: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.group.count({ where }),
      ]);

      res.status(200).json({
        status: 'success',
        data: groups,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      next(error);
    }
  };

  getGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await prisma.group.findUnique({
        where: { id: req.params.id },
        include: {
          members: {
            include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } },
          },
          owner: { select: { id: true, username: true, displayName: true, avatar: true } },
          _count: { select: { members: true, messages: true } },
        },
      });

      if (!group) throw new AppError('Group not found', 404);
      res.status(200).json({ status: 'success', data: group });
    } catch (error) {
      next(error);
    }
  };

  updateGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (!group) throw new AppError('Group not found', 404);
      if (group.ownerId !== req.user!.userId) throw new AppError('Not authorized', 403);

      const updated = await prisma.group.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
      next(error);
    }
  };

  deleteGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (!group) throw new AppError('Group not found', 404);
      if (group.ownerId !== req.user!.userId) throw new AppError('Not authorized', 403);

      await prisma.group.delete({ where: { id: req.params.id } });
      res.status(200).json({ status: 'success', message: 'Group deleted' });
    } catch (error) {
      next(error);
    }
  };

  joinGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (!group) throw new AppError('Group not found', 404);

      if (group.visibility === 'PRIVATE') {
        throw new AppError('This is a private group', 403);
      }

      const existing = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: req.user!.userId, groupId: req.params.id } },
      });
      if (existing) throw new AppError('Already a member', 409);

      await prisma.groupMember.create({
        data: { userId: req.user!.userId, groupId: req.params.id },
      });

      res.status(200).json({ status: 'success', message: 'Joined group' });
    } catch (error) {
      next(error);
    }
  };

  leaveGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: req.user!.userId, groupId: req.params.id } },
      });
      if (!membership) throw new AppError('Not a member', 404);

      await prisma.groupMember.delete({ where: { id: membership.id } });
      res.status(200).json({ status: 'success', message: 'Left group' });
    } catch (error) {
      next(error);
    }
  };

  addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (!group) throw new AppError('Group not found', 404);
      if (group.ownerId !== req.user!.userId) throw new AppError('Not authorized', 403);

      await prisma.groupMember.create({
        data: { userId: req.params.userId, groupId: req.params.id },
      });
      res.status(200).json({ status: 'success', message: 'Member added' });
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (!group) throw new AppError('Group not found', 404);
      if (group.ownerId !== req.user!.userId) throw new AppError('Not authorized', 403);

      const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: req.params.userId, groupId: req.params.id } },
      });
      if (!membership) throw new AppError('Member not found', 404);

      await prisma.groupMember.delete({ where: { id: membership.id } });
      res.status(200).json({ status: 'success', message: 'Member removed' });
    } catch (error) {
      next(error);
    }
  };

  updateMemberRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await prisma.group.findUnique({ where: { id: req.params.id } });
      if (!group) throw new AppError('Group not found', 404);
      if (group.ownerId !== req.user!.userId) throw new AppError('Not authorized', 403);

      const membership = await prisma.groupMember.findUnique({
        where: { userId_groupId: { userId: req.params.userId, groupId: req.params.id } },
      });
      if (!membership) throw new AppError('Member not found', 404);

      await prisma.groupMember.update({
        where: { id: membership.id },
        data: { role: req.body.role },
      });
      res.status(200).json({ status: 'success', message: 'Role updated' });
    } catch (error) {
      next(error);
    }
  };
}
