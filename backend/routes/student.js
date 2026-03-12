import { Router } from 'express';
import resourceRoutes from '../modules/resources/resource.routes.js';

const router = Router();

router.use(resourceRoutes);

export default router;
