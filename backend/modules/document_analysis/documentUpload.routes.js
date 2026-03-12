import { Router } from 'express';
import { uploadDocument } from './documentUpload.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';

const router = Router();

// Document upload endpoint
router.post('/upload', authMiddleware, uploadDocument);

export default router;
