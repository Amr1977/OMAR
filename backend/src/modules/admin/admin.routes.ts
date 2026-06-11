import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roleGuard';
import {
  getDashboard,
  listUsers,
  banUser,
  verifyUser,
  deleteUser,
  updateUser,
  createUser,
  getPendingProfiles,
  approveProfile,
  rejectProfile,
  listReports,
  resolveReport,
  getLogs,
  listPosts,
  deletePost,
  listConversations,
  adminListStores,
  adminSuspendStore,
  adminListProducts,
  adminDeleteProduct,
  adminListOrders,
  getPostReports,
  resolvePostReport,
} from './admin.controller';
import {
  listFeedback,
  approveFeedback,
  rejectFeedback,
  deleteFeedback,
} from '../feedback/feedback.controller';
import {
  listSubscriptions,
  verifySubscription,
  declineSubscription,
} from '../subscriptions/subscriptions.controller';
import {
  listDonations,
  verifyDonation,
  declineDonation,
} from '../donations/donations.controller';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/users', listUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/verify', verifyUser);
router.put('/users/:id', updateUser);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);
router.get('/profiles/pending', getPendingProfiles);
router.put('/profiles/:id/approve', approveProfile);
router.put('/profiles/:id/reject', rejectProfile);
router.get('/reports', listReports);
router.put('/reports/:id/resolve', resolveReport);
router.get('/logs', getLogs);
router.get('/posts', listPosts);
router.delete('/posts/:id', deletePost);
router.get('/conversations', listConversations);
router.get('/feedback', listFeedback);
router.put('/feedback/:id/approve', approveFeedback);
router.put('/feedback/:id/reject', rejectFeedback);
router.delete('/feedback/:id', deleteFeedback);
router.get('/subscriptions', listSubscriptions);
router.put('/subscriptions/:id/verify', verifySubscription);
router.put('/subscriptions/:id/decline', declineSubscription);
router.get('/donations', listDonations);
router.put('/donations/:id/verify', verifyDonation);
router.put('/donations/:id/decline', declineDonation);
router.get('/stores', adminListStores);
router.put('/stores/:id/suspend', adminSuspendStore);
router.get('/products', adminListProducts);
router.delete('/products/:id', adminDeleteProduct);
router.get('/post-reports', getPostReports);
router.put('/post-reports/:id/resolve', resolvePostReport);
router.get('/orders', adminListOrders);

export default router;
