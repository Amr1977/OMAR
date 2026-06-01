import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roleGuard';
import {
  getDashboard,
  listUsers,
  banUser,
  verifyUser,
  getPendingProfiles,
  approveProfile,
  rejectProfile,
  listReports,
  resolveReport,
  getLogs,
} from './admin.controller';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/users', listUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/verify', verifyUser);
router.get('/profiles/pending', getPendingProfiles);
router.put('/profiles/:id/approve', approveProfile);
router.put('/profiles/:id/reject', rejectProfile);
router.get('/reports', listReports);
router.put('/reports/:id/resolve', resolveReport);
router.get('/logs', getLogs);

export default router;
