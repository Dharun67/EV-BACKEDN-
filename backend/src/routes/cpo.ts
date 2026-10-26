import { Router } from 'express';
import * as cpoController from '../controllers/cpoController';

const router = Router();

router.get('/overview', cpoController.getOverview);

export default router;
