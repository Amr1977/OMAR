import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { sendConnectionRequest, acceptConnectionRequest, getMyConnections, getPendingRequests } from './connections.controller';

const router = Router();
router.post('/', authenticate, sendConnectionRequest);
router.post('/:id/accept', authenticate, acceptConnectionRequest);
router.get('/my', authenticate, getMyConnections);
router.get('/pending', authenticate, getPendingRequests);

export default router;
