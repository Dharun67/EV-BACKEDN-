import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';

const router = Router();

router.get('/overview', dashboardController.getOverview);

export default router;
