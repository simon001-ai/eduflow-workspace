import lecturerRoutes from '../modules/lecturers/lecturer.routes.js';
import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import resourceRoutes from '../modules/resources/resource.routes.js';
import submissionRoutes from '../modules/submissions/submission.routes.js';
import plagiarismRoutes from '../modules/plagiarism/plagiarism.routes.js';
import studentRoutes from './student.js';
import workspaceRoutes from '../modules/workspace/workspace.routes.js';
import inboxRoutes from '../modules/inbox/inbox.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';
import unitRoutes from '../modules/units/unit.routes.js';
import chatRoutes from '../modules/chat/chat.routes.js';

const router = Router();


router.use('/auth', authRoutes);
router.use('/resources', resourceRoutes);
router.use('/submissions', submissionRoutes);
router.use('/plagiarism', plagiarismRoutes);
router.use('/student', studentRoutes);
router.use('/workspace', workspaceRoutes);
router.use('/inbox', inboxRoutes);
router.use('/notifications', notificationRoutes);
router.use('/lecturers', lecturerRoutes);
router.use('/units', unitRoutes);
router.use('/chat', chatRoutes);

export default router;
