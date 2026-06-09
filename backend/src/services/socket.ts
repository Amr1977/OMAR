import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

let io: Server;

export const setupSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (process.env.FRONTEND_URL || '*').split(',').map(s => s.trim()),
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket: Socket, next) => {
    const start = Date.now();
    try {
      console.log(`[SOCKET] handshake start id=${socket.id} addr=${socket.handshake.address} time=${new Date().toISOString()}`);
      const token = socket.handshake.auth.token;
      console.log(`[SOCKET] handshake tokenPresent=${!!token} id=${socket.id}`);
      if (!token) {
        console.log(`[SOCKET] handshake missing token id=${socket.id}`);
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

      // To avoid a DB round-trip on every socket handshake (which can cause timeouts under load),
      // skip the prisma.user lookup by default. Enable DB verification by setting
      // SOCKET_VERIFY_DB=true in the environment if strict checking is required.
      if (process.env.SOCKET_VERIFY_DB === 'true') {
        const dbStart = Date.now();
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        const dbDuration = Date.now() - dbStart;
        console.log(`[SOCKET] DB verify duration=${dbDuration}ms id=${socket.id} userId=${decoded.userId}`);
        if (!user || !user.isActive || user.isBanned) {
          console.log(`[SOCKET] DB verify failed id=${socket.id} userId=${decoded.userId}`);
          return next(new Error('User not found or banned'));
        }
      }

      (socket as any).userId = decoded.userId;
      const duration = Date.now() - start;
      console.log(`[SOCKET] handshake success id=${socket.id} userId=${decoded.userId} duration=${duration}ms`);
      next();
    } catch (error) {
      console.error(`[SOCKET] handshake failed id=${socket.id} err=${(error as Error).message}`);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`User connected: ${userId}`);

    socket.join(`user:${userId}`);

    socket.on('join_conversation', ({ conversationId }: { conversationId: string }) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', ({ conversationId }: { conversationId: string }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('send_message', async ({ conversationId, content }: { conversationId: string; content: string }) => {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { participants: true },
        });

        if (!conversation) return;

        const isParticipant = conversation.participants.some((p) => p.userId === userId);
        if (!isParticipant) return;

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content,
          },
          include: {
            sender: { select: { id: true, roles: true } },
          },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() },
        });

        io.to(`conversation:${conversationId}`).emit('new_message', {
          message,
          conversationId,
        });

        conversation.participants.forEach((p) => {
          if (p.userId !== userId) {
            io.to(`user:${p.userId}`).emit('new_notification', {
              type: 'new_message',
              conversationId,
            });
          }
        });
      } catch (error) {
        console.error('Socket send_message error:', error);
      }
    });

    socket.on('typing', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
      });
    });

    socket.on('stop_typing', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId,
      });
    });

    socket.on('mark_read', async ({ conversationId }: { conversationId: string }) => {
      try {
        await prisma.conversationParticipant.updateMany({
          where: { conversationId, userId },
          data: { lastReadAt: new Date() },
        });

        await prisma.message.updateMany({
          where: { conversationId, senderId: { not: userId }, isRead: false },
          data: { isRead: true },
        });

        io.to(`conversation:${conversationId}`).emit('message_read', {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error('Socket mark_read error:', error);
      }
    });

    socket.on('post_created', async ({ postId }: { postId: string }) => {
      try {
        const post = await prisma.post.findUnique({
          where: { id: postId },
          select: { userId: true, privacy: true },
        });
        if (!post || post.privacy !== 'PUBLIC') return;
        const followers = await prisma.follow.findMany({
          where: { followingId: post.userId },
          select: { followerId: true },
        });
        followers.forEach(f => {
          io.to(`user:${f.followerId}`).emit('new_post_in_feed', { postId, authorId: post.userId });
        });
      } catch (err) {
        console.error('post_created socket error:', err);
      }
    });

    socket.on('disconnect', async () => {
      try {
        await prisma.user.update({ where: { id: userId }, data: { isOnline: false, lastSeenAt: new Date() } });
        io.emit('user_offline', { userId, lastSeenAt: new Date() });
      } catch {}
      console.log(`User disconnected: ${userId}`);
    });

    (async () => {
      try {
        await prisma.user.update({ where: { id: userId }, data: { isOnline: true, lastSeenAt: new Date() } });
        io.emit('user_online', { userId });
      } catch {}
    })();
  });

  return io;
};

export const getIO = () => io;
