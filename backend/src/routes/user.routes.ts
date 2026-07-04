import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { uploadAvatar, uploadCover } from '../middleware/upload';

const router = Router();
const controller = new UserController();

router.get('/', authenticate, controller.searchUsers);
router.get('/suggestions', authenticate, controller.getSuggestions);
router.get('/:id', controller.getProfile);
router.patch('/:id', authenticate, controller.updateProfile);
router.post('/:id/follow', authenticate, controller.followUser);
router.post('/:id/unfollow', authenticate, controller.unfollowUser);
router.get('/:id/followers', controller.getFollowers);
router.get('/:id/following', controller.getFollowing);
router.post('/:id/friend-request', authenticate, controller.sendFriendRequest);
router.post('/:id/accept-friend', authenticate, controller.acceptFriendRequest);
router.post('/:id/reject-friend', authenticate, controller.rejectFriendRequest);
router.post('/:id/remove-friend', authenticate, controller.removeFriend);
router.get('/:id/friends', controller.getFriends);
router.post('/avatar', authenticate, uploadAvatar, controller.updateAvatar);
router.post('/cover', authenticate, uploadCover, controller.updateCoverPhoto);
router.get('/:id/posts', controller.getUserPosts);
router.get('/:id/media', controller.getUserMedia);

export default router;
