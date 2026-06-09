import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createServiceRequest, browseServiceRequests, submitOffer } from './serviceRequests.controller';

const router = Router();
router.get('/', authenticate, browseServiceRequests);
router.post('/', authenticate, createServiceRequest);
router.post('/:id/offers', authenticate, submitOffer);

export default router;
