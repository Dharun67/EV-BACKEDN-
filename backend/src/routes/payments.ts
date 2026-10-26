import { Router } from 'express';
import * as paymentController from '../controllers/paymentController';

const router = Router();

router.get('/summary', paymentController.getPaymentSummary);
router.get('/by-method', paymentController.getPaymentsByMethod);
router.get('/', paymentController.getPayments);
router.get('/:id', paymentController.getPaymentById);

export default router;
