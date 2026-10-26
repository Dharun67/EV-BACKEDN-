import express from 'express';
import * as bookingController from '../controllers/bookingController';
import { authenticate } from '../middleware/authMiddleware';
const router = express.Router();
router.use(authenticate);

router.post('/feasibility', bookingController.checkFeasibility);
router.post('/', bookingController.createBooking);
router.get('/user/:userId', bookingController.getUserBookings);
router.get('/:stationId/alternatives', bookingController.getAlternatives);
router.post('/:bookingId/rebook', bookingController.autoRebook);

export default router;
