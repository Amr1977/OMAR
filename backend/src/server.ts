import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { prisma } from './config/database';
import { setupSocket } from './services/socket';
import { generalLimiter } from './middleware/rateLimiter';

import authRoutes from './modules/auth/auth.routes';
import profileRoutes from './modules/profiles/profiles.routes';
import browseRoutes from './modules/browse/browse.routes';
import requestRoutes from './modules/requests/requests.routes';
import messagingRoutes from './modules/messaging/messaging.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import paymentRoutes from './modules/payments/payments.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'INTERNAL', message: 'Internal server error' });
});

setupSocket(httpServer);

const PORT = parseInt(process.env.PORT || '3001');

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected (Neon/PostgreSQL)');

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
