import { Router } from 'express';
import * as vehicleController from '../controllers/vehicleController';

const router = Router();

router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);
router.get('/:id/sessions', vehicleController.getVehicleSessions);
router.get('/:id/energy', vehicleController.getVehicleEnergy);

export default router;
