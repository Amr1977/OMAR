import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { listNotifications, markAllRead, markOneRead } from './notifications.controller';

const router = Router();

router.use(authenticate);

router.get('/', listNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markOneRead);

export default router;
