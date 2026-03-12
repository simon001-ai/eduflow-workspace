import { Router } from 'express';
import * as inboxController from './inbox.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';
import multer from 'multer';
import path from 'path';

const router = Router();
const upload = multer({ dest: path.join(process.cwd(), 'uploads') });

router.post('/send', authMiddleware, upload.array('attachments'), inboxController.sendInboxEmail);
router.post('/webhook', inboxController.receiveEmailWebhook); // Webhook usually doesn't require auth
router.get('/', authMiddleware, inboxController.listInbox);
router.get('/sent', authMiddleware, inboxController.listSent);
router.get('/spam', authMiddleware, inboxController.listSpam);
router.post('/:id/mark-spam', authMiddleware, inboxController.markSpam);
router.post('/:id/unmark-spam', authMiddleware, inboxController.unmarkSpam);

// Student: Get all lecturers teaching the student
router.get('/lecturers', authMiddleware, inboxController.getLecturersForStudent);
// Lecturer: Get all students for a unit
router.get('/unit/:unitId/students', authMiddleware, inboxController.getStudentsForUnit);

export default router;
