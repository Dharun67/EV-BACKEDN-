import { Router } from 'express';
import * as revenueController from '../controllers/revenueController';

const router = Router();

router.get('/summary', revenueController.getRevenueSummary);
router.get('/trend', revenueController.getRevenueTrend);
router.get('/by-station', revenueController.getRevenueByStation);
router.get('/', revenueController.getRevenue);

export default router;
