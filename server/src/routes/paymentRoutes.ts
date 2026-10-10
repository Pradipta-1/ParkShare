import { Router } from 'express';
import { createPaymentIntent, verifyPayment } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/create', authenticate, createPaymentIntent);
router.post('/verify', authenticate, verifyPayment);

export default router;
