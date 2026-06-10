import express, { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { ingestClientLog, clientLogLimiter, ingestClientLogPublic, clientPublicLimiter } from './logs.controller';

const router = Router();

// Accept text/plain for sendBeacon (avoids CORS preflight cross-origin)
const textParser = express.text({ type: 'text/plain' });

router.post('/client', textParser, authenticate, clientLogLimiter, ingestClientLog);
// anonymous public ingest endpoint with stricter rate limiting
router.post('/client/public', textParser, clientPublicLimiter, ingestClientLogPublic);

export default router;
