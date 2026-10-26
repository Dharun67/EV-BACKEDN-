import { Router } from 'express';
import * as stationController from '../controllers/stationController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/', requireAuth, stationController.createStation);
router.get('/search', stationController.searchStations);
router.get('/', stationController.getStations);
router.get('/:id', stationController.getStationById);
router.get('/:id/chargers', stationController.getStationChargers);
router.get('/:id/sessions', stationController.getStationSessions);
router.get('/:id/statistics', stationController.getStationStatistics);

export default router;
