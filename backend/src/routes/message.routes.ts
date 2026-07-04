import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new MessageController();

router.get('/conversations', authenticate, controller.getConversations);
router.get('/:userId', authenticate, controller.getMessages);
router.post('/', authenticate, controller.sendMessage);
router.delete('/:id', authenticate, controller.deleteMessage);
router.post('/:id/read', authenticate, controller.markAsRead);

export default router;
