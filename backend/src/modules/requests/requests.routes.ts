import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireGuardian, requireModule } from '../../middleware/roleGuard';
import { checkContactRequestLimit } from '../../middleware/subscriptionGuard';
import {
  sendRequest,
  getSentRequests,
  getReceivedRequests,
  acceptRequest,
  rejectRequest,
} from './requests.controller';

const router = Router();

router.use(authenticate);

router.post('/', requireGuardian, requireModule('guardian'), checkContactRequestLimit, sendRequest);
router.get('/sent', getSentRequests);
router.get('/received', getReceivedRequests);
router.put('/:id/accept', acceptRequest);
router.put('/:id/reject', rejectRequest);

export default router;
