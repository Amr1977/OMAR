import { Router } from 'express';
import { register, verifyOtp, refreshToken, logout, getMe, updateRoles, updateAvatar, deleteAvatar } from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/refresh-token', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/roles', authenticate, updateRoles);
router.put('/avatar', authenticate, updateAvatar);
router.delete('/avatar', authenticate, deleteAvatar);

export default router;
