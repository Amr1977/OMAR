import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { globalSearch } from './search.controller';

const router = Router();
router.get('/', authenticate, globalSearch);

export default router;
