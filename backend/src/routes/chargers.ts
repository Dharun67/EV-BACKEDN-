import { Router } from 'express';
import * as chargerController from '../controllers/chargerController';

const router = Router();

router.get('/statistics', chargerController.getChargerStatistics);
router.get('/', chargerController.getChargers);
router.get('/:chargerId', chargerController.getChargerById);
router.patch('/:chargerId/status', chargerController.updateChargerStatus);

export default router;
