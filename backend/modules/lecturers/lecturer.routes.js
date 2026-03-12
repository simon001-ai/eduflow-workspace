
import { Router } from 'express';
import { getLecturerDashboard, getLecturerUnits, uploadResource, getUnitResources, getLecturersForStudent, getLecturerSubmissions } from './lecturer.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';
import roleMiddleware from '../../middleware/role.middleware.js';

const router = Router();

// Student fetches lecturers for their registered units
router.get('/students/:studentId/lecturers', getLecturersForStudent);


router.get('/units', authMiddleware, roleMiddleware('lecturer'), getLecturerUnits);
router.post('/resources/upload', authMiddleware, roleMiddleware('lecturer'), ...uploadResource);
router.get('/resources/:unitId', authMiddleware, roleMiddleware('lecturer'), getUnitResources);
router.get('/submissions', authMiddleware, roleMiddleware('lecturer'), getLecturerSubmissions);
router.get('/dashboard', authMiddleware, roleMiddleware('lecturer'), getLecturerDashboard);

export default router;
