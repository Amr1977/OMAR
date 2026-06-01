import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createCheckout, getPlans, handleWebhook } from './payments.controller';

const router = Router();

router.get('/plans', getPlans);
router.post('/create-checkout', authenticate, createCheckout);
router.post('/webhook', handleWebhook);

export default router;
