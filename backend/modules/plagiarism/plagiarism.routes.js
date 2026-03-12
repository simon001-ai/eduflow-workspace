import { Router } from 'express';
import { upload, secureAnalyzeDocument, getAnalysisResultController, checkPlagiarism } from './plagiarism.controller.js';
import roleMiddleware from '../../middleware/role.middleware.js';
import authMiddleware from '../../middleware/auth.middleware.js';

const router = Router();

// Document upload and analysis
router.post(
    '/analyze',
    authMiddleware,
    roleMiddleware('student'),
    upload.single('file'), // Multer middleware to handle file upload
    ...secureAnalyzeDocument.slice(2) // Only the controller and any additional middleware
);

router.get(
    '/analyze/result/:scanId',
    authMiddleware,
    roleMiddleware('student'),
    getAnalysisResultController
);

// (Legacy/simulated) plagiarism check
router.post(
    '/check',
    authMiddleware,
    roleMiddleware('student'),
    checkPlagiarism
);

export default router;
