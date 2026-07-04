import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new NotificationController();

router.get('/', authenticate, controller.getNotifications);
router.get('/unread-count', authenticate, controller.getUnreadCount);
router.patch('/:id/read', authenticate, controller.markAsRead);
router.patch('/read-all', authenticate, controller.markAllAsRead);

export default router;
