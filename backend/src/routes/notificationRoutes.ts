import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { 
  registerDevice, 
  unregisterDevice, 
  getPreferences, 
  updatePreferences 
} from '../controllers/notificationController';

const router = Router();

router.use(authenticate);

router.post('/register-device', registerDevice);
router.delete('/unregister-device', unregisterDevice);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

export default router;
