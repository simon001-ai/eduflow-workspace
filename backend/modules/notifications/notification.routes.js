import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';
import roleMiddleware from '../../middleware/role.middleware.js';

const router = Router();

// Student fetches their notifications
router.get('/students/:studentId/notifications', authMiddleware, roleMiddleware('student'), notificationController.getStudentNotifications);

export default router;
