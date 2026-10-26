import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { requestRescue, getRescueStatus } from '../controllers/rescueController';

const router = Router();

// Protect rescue routes
router.use(authenticate);

// Request a mobile rescue unit
router.post('/request', requestRescue);

// Get current rescue status
router.get('/status', getRescueStatus);

export default router;
