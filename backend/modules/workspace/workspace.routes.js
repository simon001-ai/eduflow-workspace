import { Router } from 'express';
import * as workspaceController from './workspace.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';
import roleMiddleware from '../../middleware/role.middleware.js';

const router = Router();

// Draft endpoints
router.post('/drafts', authMiddleware, roleMiddleware('student'), workspaceController.saveDraft);
router.get('/drafts', authMiddleware, roleMiddleware('student'), workspaceController.getAllDrafts);
router.get('/drafts/:resourceId', authMiddleware, roleMiddleware('student'), workspaceController.getDraft);
router.delete('/drafts/:draftId', authMiddleware, roleMiddleware('student'), workspaceController.deleteDraft);

// Assignment submission
router.post('/turn-in', authMiddleware, roleMiddleware('student'), workspaceController.turnInAssignment);

// AI recommend
router.post('/ai-recommend', authMiddleware, roleMiddleware('student'), workspaceController.aiRecommend);

// CAT endpoints
router.get('/cats', authMiddleware, roleMiddleware('student'), workspaceController.listCATs);
router.get('/cats/:catId', authMiddleware, roleMiddleware('student'), workspaceController.getCAT);
router.post('/cats/:catId/submit', authMiddleware, roleMiddleware('student'), workspaceController.submitCAT);

export default router;
