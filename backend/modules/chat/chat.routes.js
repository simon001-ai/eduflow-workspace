import { Router } from 'express';
import authMiddleware from '../../middleware/auth.middleware.js';
import roleMiddleware from '../../middleware/role.middleware.js';
import * as chatController from './chat.controller.js';

const router = Router();

// File upload routes
router.post(
	'/upload-image',
	authMiddleware,
	chatController.imageUpload.single('file'),
	chatController.uploadImage
);

router.post(
	'/upload-document',
	authMiddleware,
	chatController.documentUpload.single('file'),
	chatController.uploadDocument
);

// Student routes
router.get(
	'/student/lecturers/:student_id',
	authMiddleware,
	roleMiddleware('student'),
	chatController.getStudentLecturers
);

// Lecturer routes
router.get(
	'/lecturer/unit/:unit_id/students',
	authMiddleware,
	roleMiddleware('lecturer'),
	chatController.getUnitStudents
);

// Chat room (get messages between two users)
router.get(
	'/room/:otherId',
	authMiddleware,
	chatController.getChatRoom
);

// Get conversations list
router.get(
	'/conversations',
	authMiddleware,
	chatController.getConversations
);

// Send message
router.post(
	'/message',
	authMiddleware,
	chatController.sendMessage
);

// Delete message
router.delete(
	'/message/:messageId',
	authMiddleware,
	chatController.deleteMessage
);

// Get unread count
router.get(
	'/unread-count',
	authMiddleware,
	chatController.getUnreadCount
);

export default router;
