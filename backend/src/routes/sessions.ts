import { Router } from 'express';
import * as sessionController from '../controllers/sessionController';

const router = Router();

router.get('/statistics', sessionController.getSessionStatistics);
router.get('/', sessionController.getSessions);
router.get('/:id', sessionController.getSessionById);
router.get('/station/:stationId', sessionController.getSessionsByStation);
router.get('/vehicle/:vehicleId', sessionController.getSessionsByVehicle);

export default router;
