import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireGuardian, requireGroom } from '../../middleware/roleGuard';
import { checkContactRequestLimit } from '../../middleware/subscriptionGuard';
import {
  sendRequest,
  getSentRequests,
  getReceivedRequests,
  acceptRequest,
  rejectRequest,
  guardianPropose,
  getGroomInbox,
  getGuardianDashboard,
  getGroomDashboard,
  markMarriageSuccess,
} from './requests.controller';

const router = Router();

router.use(authenticate);

router.post('/', requireGuardian, checkContactRequestLimit, sendRequest);
router.get('/sent', getSentRequests);
router.get('/received', getReceivedRequests);
router.put('/:id/accept', acceptRequest);
router.put('/:id/reject', rejectRequest);
router.post('/guardian-propose', requireGuardian, guardianPropose);
router.get('/groom-inbox', requireGroom, getGroomInbox);
router.get('/guardian-dashboard', requireGuardian, getGuardianDashboard);
router.get('/groom-dashboard', requireGroom, getGroomDashboard);
router.post('/marriage-success', markMarriageSuccess);

export default router;
