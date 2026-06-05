import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createDonation } from './donations.controller';

const router = Router();

router.post('/', authenticate, createDonation);

export default router;
