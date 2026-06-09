import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireGuardian } from '../../middleware/roleGuard';
import { requirePremium } from '../../middleware/subscriptionGuard';
import { browseProfiles, getProfileDetail, getAiSuggestions, browseGroomsForGuardian } from './browse.controller';

const router = Router();

router.use(authenticate);
router.use(requireGuardian);

router.get('/profiles', browseProfiles);
router.get('/profiles/:id', getProfileDetail);
router.get('/ai-suggestions', requirePremium, getAiSuggestions);
router.get('/grooms', browseGroomsForGuardian);

export default router;
