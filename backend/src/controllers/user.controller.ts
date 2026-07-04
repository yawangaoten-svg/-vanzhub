import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';

const userService = new UserService();

export class UserController {
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.getProfile(req.params.id);
      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.updateProfile(req.params.id, req.user!.userId, req.body);
      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, page, limit } = req.query;
      const result = await userService.searchUsers(q as string, {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      });
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  };

  getSuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const suggestions = await userService.getSuggestions(req.user!.userId);
      res.status(200).json({ status: 'success', data: suggestions });
    } catch (error) {
      next(error);
    }
  };

  followUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await userService.followUser(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', message: 'Followed successfully' });
    } catch (error) {
      next(error);
    }
  };

  unfollowUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await userService.unfollowUser(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', message: 'Unfollowed successfully' });
    } catch (error) {
      next(error);
    }
  };

  getFollowers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const result = await userService.getFollowers(req.params.id, {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      });
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  };

  getFollowing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const result = await userService.getFollowing(req.params.id, {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      });
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  };

  sendFriendRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await userService.sendFriendRequest(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', message: 'Friend request sent' });
    } catch (error) {
      next(error);
    }
  };

  acceptFriendRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await userService.respondToFriendRequest(req.user!.userId, req.params.id, 'ACCEPTED');
      res.status(200).json({ status: 'success', message: 'Friend request accepted' });
    } catch (error) {
      next(error);
    }
  };

  rejectFriendRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await userService.respondToFriendRequest(req.user!.userId, req.params.id, 'BLOCKED');
      res.status(200).json({ status: 'success', message: 'Friend request rejected' });
    } catch (error) {
      next(error);
    }
  };

  removeFriend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await userService.removeFriend(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', message: 'Friend removed' });
    } catch (error) {
      next(error);
    }
  };

  getFriends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const result = await userService.getFriends(req.params.id, {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      });
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  };

  updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ status: 'error', message: 'No file uploaded' });
        return;
      }
      const user = await userService.updateAvatar(req.user!.userId, file);
      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  updateCoverPhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ status: 'error', message: 'No file uploaded' });
        return;
      }
      const user = await userService.updateCoverPhoto(req.user!.userId, file);
      res.status(200).json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  };

  getUserPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const result = await userService.getUserPosts(req.params.id, {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      });
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  };

  getUserMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const result = await userService.getUserMedia(req.params.id, {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      });
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  };
}
