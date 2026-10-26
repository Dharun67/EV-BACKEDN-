import { Router } from 'express';
import * as fleetController from '../controllers/fleetController';

const router = Router();

router.get('/statistics', fleetController.getFleetStatistics);
router.get('/', fleetController.getFleet);

export default router;
