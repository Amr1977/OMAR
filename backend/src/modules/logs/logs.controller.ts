import { Response, Request } from 'express';
import rateLimit from 'express-rate-limit';
import logger from '../../services/logger';
import { AuthRequest } from '../../middleware/auth';

export const clientLogLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: 'RATE_LIMIT',
    messageAr: 'طلبات كثيرة جداً. يرجى المحاولة بعد دقيقة',
    messageEn: 'Too many requests. Please try again later.',
  },
});

// Public, stricter limiter for anonymous clients
export const clientPublicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: 'RATE_LIMIT',
    messageAr: 'طلبات كثيرة جداً. يرجى المحاولة بعد دقيقة',
    messageEn: 'Too many requests. Please try again later.',
  },
});

export const ingestClientLog = async (req: AuthRequest, res: Response) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const payload = body;
    const entries = Array.isArray(payload) ? payload : [payload];

    for (const entry of entries) {
      const { level = 'debug', message = '', stack, url, userAgent, timestamp } = entry || {};

      const logEntry = {
        client: true,
        userId: req.userId || 'anonymous',
        url,
        userAgent: userAgent || req.headers['user-agent'],
        timestamp: timestamp || new Date().toISOString(),
        stack,
      };

      switch (level) {
        case 'error':
          logger.error(`[CLIENT] ${message}`, logEntry);
          break;
        case 'warn':
          logger.warn(`[CLIENT] ${message}`, logEntry);
          break;
        case 'info':
          logger.info(`[CLIENT] ${message}`, logEntry);
          break;
        default:
          logger.debug(`[CLIENT] ${message}`, logEntry);
      }
    }

    res.json({ ok: true });
  } catch (error) {
    logger.error('Failed to ingest client log', { error });
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to process log' });
  }
};

// Public ingestion endpoint handler — accepts anonymous logs but tags userId as 'anonymous'
export const ingestClientLogPublic = async (req: Request, res: Response) => {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const payload = body;
    const entries = Array.isArray(payload) ? payload : [payload];

    for (const entry of entries) {
      const { level = 'debug', message = '', stack, url, userAgent, timestamp } = entry || {};

      const logEntry = {
        client: true,
        userId: 'anonymous',
        url,
        userAgent: userAgent || req.headers['user-agent'],
        timestamp: timestamp || new Date().toISOString(),
        stack,
      };

      switch (level) {
        case 'error':
          logger.error(`[CLIENT][ANON] ${message}`, logEntry);
          break;
        case 'warn':
          logger.warn(`[CLIENT][ANON] ${message}`, logEntry);
          break;
        case 'info':
          logger.info(`[CLIENT][ANON] ${message}`, logEntry);
          break;
        default:
          logger.debug(`[CLIENT][ANON] ${message}`, logEntry);
      }
    }

    res.json({ ok: true });
  } catch (error) {
    logger.error('Failed to ingest client public log', { error });
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to process log' });
  }
};
