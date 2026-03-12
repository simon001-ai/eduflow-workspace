
import { Router } from 'express';
import * as resourceController from './resource.controller.js';
import roleMiddleware from '../../middleware/role.middleware.js';
import authMiddleware from '../../middleware/auth.middleware.js';

const router = Router();

// Lecturer uploads a resource (note, assignment, CAT, etc.)
router.post('/', authMiddleware, roleMiddleware('lecturer'), resourceController.uploadResource);

// Student fetches resources for a unit
router.get('/units/:unitId/resources', authMiddleware, roleMiddleware('student'), resourceController.getResourcesForUnit);

export default router;
