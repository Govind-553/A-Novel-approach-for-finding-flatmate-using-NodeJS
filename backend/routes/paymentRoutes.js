import express from 'express';
import { createCheckoutSession, completePayment, cancelPayment } from '../controllers/paymentControllers.js';

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSession);
router.get('/complete', completePayment);
router.get('/cancel', cancelPayment);

export default router;
