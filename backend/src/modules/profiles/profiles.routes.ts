import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireGroom } from '../../middleware/roleGuard';
import {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
  uploadPhoto,
  deletePhoto,
  submitForReview,
  getMyProfile,
} from './profiles.controller';

const router = Router();

router.use(authenticate);

router.post('/', requireGroom, createProfile);
router.get('/my', getMyProfile);
router.get('/:id', getProfile);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);
router.post('/:id/photos', uploadPhoto);
router.delete('/:id/photos/:photoId', deletePhoto);
router.post('/:id/submit', submitForReview);

export default router;
