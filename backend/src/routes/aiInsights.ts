import { Router } from 'express';
import * as aiInsightController from '../controllers/aiInsightController';

const router = Router();

router.get('/', aiInsightController.getAIInsights);
router.get('/summary', aiInsightController.getAIInsights);

export default router;
