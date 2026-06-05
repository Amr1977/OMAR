import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createSubscription, getMySubscription } from './subscriptions.controller';

const router = Router();

router.post('/', authenticate, createSubscription);
router.get('/my', authenticate, getMySubscription);

export default router;
