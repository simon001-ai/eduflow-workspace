import { Router } from 'express';
import * as authController from './auth.controller.js';

const router = Router();

router.post('/student/login', authController.studentLogin);
router.post('/lecturer/login', authController.lecturerLogin);

export default router;
