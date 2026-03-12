import { Router } from 'express';
import * as submissionController from './submission.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';
import roleMiddleware from '../../middleware/role.middleware.js';

const router = Router();

// Student submits an analyzed document (from plagiarism analysis)
router.post('/submit', authMiddleware, roleMiddleware('student'), submissionController.submitAnalyzedDocument);

// Student submits an assignment (two-path: Redo or Submit Anyway)
router.post('/submit-assignment', authMiddleware, roleMiddleware('student'), submissionController.submitAssignment);

// Get student's submissions list
router.get('/', authMiddleware, roleMiddleware('student'), submissionController.getStudentSubmissions);

// Lecturer grades a submission
router.post('/:id/grade', authMiddleware, roleMiddleware('lecturer'), submissionController.gradeSubmission);

// Get submission details (for viewing)
router.get('/:id', authMiddleware, submissionController.getSubmissionDetails);

// Detailed plagiarism report
router.get('/:id/plagiarism-report', authMiddleware, submissionController.getPlagiarismReport);

// Detailed AI report
router.get('/:id/ai-report', authMiddleware, submissionController.getAIReport);

export default router;
