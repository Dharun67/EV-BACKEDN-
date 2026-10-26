import { Router } from 'express';
import * as demandController from '../controllers/demandController';

const router = Router();

router.get('/summary', demandController.getDemandSummary);
router.get('/peak', demandController.getPeakDemand);
router.get('/by-zone', demandController.getDemandByZone);
router.get('/trend', demandController.getDemandTrend);
router.get('/', demandController.getDemand);
router.get('/:location', demandController.getDemand); // Fallback for specific location logic if needed

export default router;
