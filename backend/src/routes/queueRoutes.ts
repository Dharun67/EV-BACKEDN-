import { Router } from 'express';
import { 
  joinQueue, 
  leaveQueue, 
  getQueuePosition, 
  getStationQueue, 
  getQueueSize,
  startSession,
  endSession
} from '../controllers/queueController';

const router = Router();

router.post('/join', joinQueue);
router.post('/leave', leaveQueue);
router.post('/start-session', startSession);
router.post('/end-session', endSession);
router.get('/:stationId', getStationQueue);
router.get('/:stationId/position/:vehicleId', getQueuePosition);
router.get('/:stationId/size', getQueueSize);

export default router;
