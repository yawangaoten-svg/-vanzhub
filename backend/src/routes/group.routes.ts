import { Router } from 'express';
import { GroupController } from '../controllers/group.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new GroupController();

router.post('/', authenticate, controller.createGroup);
router.get('/', authenticate, controller.getGroups);
router.get('/:id', controller.getGroup);
router.patch('/:id', authenticate, controller.updateGroup);
router.delete('/:id', authenticate, controller.deleteGroup);
router.post('/:id/join', authenticate, controller.joinGroup);
router.post('/:id/leave', authenticate, controller.leaveGroup);
router.post('/:id/members/:userId', authenticate, controller.addMember);
router.delete('/:id/members/:userId', authenticate, controller.removeMember);
router.patch('/:id/members/:userId/role', authenticate, controller.updateMemberRole);

export default router;
