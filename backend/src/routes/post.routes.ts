import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new PostController();

router.get('/feed', authenticate, controller.getFeed);
router.post('/', authenticate, controller.createPost);
router.get('/drafts', authenticate, controller.getDrafts);
router.get('/:id', controller.getPost);
router.patch('/:id', authenticate, controller.updatePost);
router.delete('/:id', authenticate, controller.deletePost);
router.post('/:id/like', authenticate, controller.toggleReaction);
router.post('/:id/bookmark', authenticate, controller.toggleBookmark);
router.get('/:id/comments', controller.getComments);
router.post('/:id/comments', authenticate, controller.createComment);
router.delete('/comments/:commentId', authenticate, controller.deleteComment);
router.get('/:id/reactions', controller.getReactions);
router.get('/trending', controller.getTrendingHashtags);

export default router;
