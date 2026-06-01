import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import {
  listConversations,
  getConversation,
  sendMessage,
  markRead,
} from './messaging.controller';

const router = Router();

router.use(authenticate);

router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversation);
router.post('/conversations/:id', sendMessage);
router.put('/conversations/:id/read', markRead);

export default router;
