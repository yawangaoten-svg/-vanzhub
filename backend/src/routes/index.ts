import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import postRoutes from './post.routes';
import mediaRoutes from './media.routes';
import groupRoutes from './group.routes';
import messageRoutes from './message.routes';
import notificationRoutes from './notification.routes';
import searchRoutes from './search.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/media', mediaRoutes);
router.use('/groups', groupRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);

export default router;
