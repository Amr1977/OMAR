import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  listConversations,
  getConversation,
  sendMessage,
  markRead,
} from './messaging.controller';
import { startDirectConversation } from './direct.controller';

const router = Router();

router.use(authenticate);

router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversation);
router.post('/conversations/:id', sendMessage);
router.put('/conversations/:id/read', markRead);
router.post('/direct', startDirectConversation);

export default router;
