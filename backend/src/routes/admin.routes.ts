import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();
const controller = new AdminController();

router.use(authenticate, requireAdmin);

router.get('/dashboard', controller.getDashboard);
router.get('/users', controller.getUsers);
router.patch('/users/:userId/status', controller.updateUserStatus);
router.delete('/users/:userId', controller.deleteUser);
router.get('/reports', controller.getReports);
router.patch('/reports/:reportId', controller.updateReportStatus);
router.get('/analytics', controller.getAnalytics);
router.get('/activity-logs', controller.getActivityLogs);

export default router;
