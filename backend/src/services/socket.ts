import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

let io: Server;

export const setupSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user || !user.isActive || user.isBanned) {
        return next(new Error('User not found or banned'));
      }

      (socket as any).userId = decoded.userId;
      next();
    } catch (error) {
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
            sender: { select: { id: true, role: true } },
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

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
};

export const getIO = () => io;
