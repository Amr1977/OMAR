import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { createBride, getMyBrides, getBride, updateBride, deleteBride } from './brides.controller';

const router = Router();

router.post('/', authenticate, createBride);
router.get('/', authenticate, getMyBrides);
router.get('/:id', authenticate, getBride);
router.put('/:id', authenticate, updateBride);
router.delete('/:id', authenticate, deleteBride);

export default router;
