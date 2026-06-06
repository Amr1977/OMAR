import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireGuardian, requireModule } from '../../middleware/roleGuard';
import { requirePremium } from '../../middleware/subscriptionGuard';
import { browseProfiles, getProfileDetail, getAiSuggestions } from './browse.controller';

const router = Router();

router.use(authenticate);
router.use(requireGuardian);
router.use(requireModule('guardian'));

router.get('/profiles', browseProfiles);
router.get('/profiles/:id', getProfileDetail);
router.get('/ai-suggestions', requirePremium, getAiSuggestions);

export default router;
