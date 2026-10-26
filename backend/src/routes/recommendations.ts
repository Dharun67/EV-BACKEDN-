import { Router } from 'express';
import * as recommendationController from '../controllers/recommendationController';

const router = Router();

router.get('/top', recommendationController.getTopRecommendations);
router.get('/', recommendationController.getRecommendations);
router.get('/:id', recommendationController.getRecommendationById);

export default router;
