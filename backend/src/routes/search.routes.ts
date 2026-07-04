import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new SearchController();

router.get('/', authenticate, controller.search);
router.get('/users', authenticate, controller.searchUsers);
router.get('/posts', authenticate, controller.searchPosts);
router.get('/hashtags', authenticate, controller.searchHashtags);
router.get('/photos', authenticate, controller.searchPhotos);
router.get('/videos', authenticate, controller.searchVideos);
router.get('/groups', authenticate, controller.searchGroups);

export default router;
