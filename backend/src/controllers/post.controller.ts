import { Request, Response, NextFunction } from 'express';
import { PostService } from '../services/post.service';

const postService = new PostService();

export class PostController {
  getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const result = await postService.getFeed(req.user!.userId, {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      });
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  };

  createPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await postService.createPost(req.user!.userId, req.body);
      res.status(201).json({ status: 'success', data: post });
    } catch (error) {
      next(error);
    }
  };

  getPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await postService.getPost(req.params.id);
      res.status(200).json({ status: 'success', data: post });
    } catch (error) {
      next(error);
    }
  };

  updatePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await postService.updatePost(req.params.id, req.user!.userId, req.body);
      res.status(200).json({ status: 'success', data: post });
    } catch (error) {
      next(error);
    }
  };

  deletePost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await postService.deletePost(req.params.id, req.user!.userId);
      res.status(200).json({ status: 'success', message: 'Post deleted' });
    } catch (error) {
      next(error);
    }
  };

  getDrafts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const result = await postService.getDrafts(req.user!.userId, {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      });
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  };

  toggleReaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { type } = req.body;
      const result = await postService.toggleReaction(req.user!.userId, req.params.id, type);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  toggleBookmark = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await postService.toggleBookmark(req.user!.userId, req.params.id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  getComments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const result = await postService.getComments(req.params.id, {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
      });
      res.status(200).json({ status: 'success', ...result });
    } catch (error) {
      next(error);
    }
  };

  createComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const comment = await postService.createComment(req.user!.userId, req.params.id, req.body);
      res.status(201).json({ status: 'success', data: comment });
    } catch (error) {
      next(error);
    }
  };

  deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await postService.deleteComment(req.params.commentId, req.user!.userId);
      res.status(200).json({ status: 'success', message: 'Comment deleted' });
    } catch (error) {
      next(error);
    }
  };

  getReactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reactions = await postService.getReactions(req.params.id);
      res.status(200).json({ status: 'success', data: reactions });
    } catch (error) {
      next(error);
    }
  };

  getTrendingHashtags = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hashtags = await postService.getTrendingHashtags();
      res.status(200).json({ status: 'success', data: hashtags });
    } catch (error) {
      next(error);
    }
  };
}
