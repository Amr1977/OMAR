import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole, requireModule } from '../../middleware/roleGuard';
import { upload } from '../../config/upload';
import {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
  uploadPhoto,
  deletePhoto,
  setPrimaryPhoto,
  submitForReview,
  getMyProfile,
  toggleVisibility,
} from './profiles.controller';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('GROOM', 'GUARDIAN', 'BOTH', 'ADMIN'), requireModule('marriage', 'guardian'), createProfile);
router.get('/my', getMyProfile);
router.get('/:id', getProfile);
router.put('/:id', updateProfile);
router.delete('/:id', deleteProfile);
router.post('/:id/photos', upload.single('photo'), uploadPhoto);
router.put('/:id/photos/:photoId/primary', setPrimaryPhoto);
router.delete('/:id/photos/:photoId', deletePhoto);
router.put('/:id/visibility', toggleVisibility);
router.post('/:id/submit', submitForReview);

export default router;
