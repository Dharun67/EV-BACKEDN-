import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

router.get('/network', analyticsController.getNetworkAnalytics);
router.get('/energy', analyticsController.getEnergyAnalytics);
router.get('/utilization', analyticsController.getUtilizationAnalytics);
router.get('/sessions', analyticsController.getSessionAnalytics);
router.get('/stations', analyticsController.getStationAnalytics);

export default router;
