import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '60'),
  message: {
    error: 'RATE_LIMIT',
    messageAr: 'طلبات كثيرة جداً. يرجى المحاولة بعد دقيقة',
    messageEn: 'Too many requests. Please try again later.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    error: 'RATE_LIMIT',
    messageAr: 'طلبات كثيرة جداً. يرجى المحاولة بعد دقيقة',
    messageEn: 'Too many requests. Please try again later.',
  },
});
