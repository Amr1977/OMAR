import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { prisma } from './config/database';
import { setupSocket } from './services/socket';
import { generalLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import logger from './services/logger';

import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profiles/profiles.routes';
import browseRoutes from './modules/browse/browse.routes';
import requestRoutes from './modules/requests/requests.routes';
import messagingRoutes from './modules/messaging/messaging.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import paymentRoutes from './modules/payments/payments.routes';
import adminRoutes from './modules/admin/admin.routes';
import socialRoutes from './modules/social/social.routes';
import { startCleanupJobs } from './services/cleanup.service';
import feedbackRoutes from './modules/feedback/feedback.routes';
import subscriptionRoutes from './modules/subscriptions/subscriptions.routes';
import donationRoutes from './modules/donations/donations.routes';
import brideRoutes from './modules/brides/brides.routes';
import serviceRoutes from './modules/services/services.routes';
import eshopRoutes from './modules/eshops/eshops.routes';
import logRoutes from './modules/logs/logs.routes';
import connectionRoutes from './modules/connections/connections.routes';
import serviceRequestRoutes from './modules/serviceRequests/serviceRequests.routes';
import searchRoutes from './modules/search/search.routes';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim());
app.set('trust proxy', 1);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(generalLimiter);
app.use(requestLogger);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', async (_req, res) => {
  try {
    const [totalUsers, totalProfiles, totalPosts, totalMessages, totalStores, totalOrders, totalServiceRequests] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.post.count(),
      prisma.message.count(),
      prisma.store.count(),
      prisma.order.count(),
      prisma.serviceRequest.count(),
    ]);
    res.json({ users: totalUsers, profiles: totalProfiles, posts: totalPosts, messages: totalMessages, businesses: totalStores, orders: totalOrders, serviceRequests: totalServiceRequests });
  } catch {
    res.status(500).json({ error: 'INTERNAL' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/brides', brideRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/eshops', eshopRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/search', searchRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'INTERNAL', message: 'Internal server error' });
});

setupSocket(httpServer);

const PORT = parseInt(process.env.PORT || '3001');

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected (Neon/PostgreSQL)');

    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      startCleanupJobs();
      logger.info('Cleanup jobs started');
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
