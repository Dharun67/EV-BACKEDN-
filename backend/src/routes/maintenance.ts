import { Router } from 'express';
import * as maintenanceController from '../controllers/maintenanceController';

import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticate);

router.get('/statistics', authorize(['Admin', 'Support', 'Fleet Manager']), maintenanceController.getMaintenanceStatistics);
router.get('/', authorize(['Admin', 'Support', 'Fleet Manager']), maintenanceController.getMaintenance);
router.get('/:id', authorize(['Admin', 'Support', 'Fleet Manager']), maintenanceController.getMaintenanceById);

export default router;
