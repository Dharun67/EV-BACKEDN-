import { Router } from 'express';
import * as infrastructureController from '../controllers/infrastructureController';

const router = Router();

router.get('/gaps', infrastructureController.getInfrastructureGaps);
router.get('/', infrastructureController.getInfrastructure);

export default router;
