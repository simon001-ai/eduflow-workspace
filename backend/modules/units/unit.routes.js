
import { Router } from 'express';
import * as unitController from './unit.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';
import roleMiddleware from '../../middleware/role.middleware.js';
import { getUnitById } from './unit.controller.js';

const router = Router();

// GET /api/units/:unitId
router.get('/:unitId', getUnitById);

// Student fetches their registered units
router.get('/students/:studentId/units', authMiddleware, roleMiddleware('student'), unitController.getUnitsForStudent);

export default router;
