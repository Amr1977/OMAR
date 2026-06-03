import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { notifyNewMessage } from '../../services/notification.service';

const p = (req: AuthRequest) => req.params as { id: string };

export const listConversations = async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId: req.userId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                role: true,
                isVerified: true,
                profile: {
                  select: {
                    displayName: true,
                    photos: { where: { isPrimary: true }, take: 1, orderBy: { order: 'asc' } },
                  },
                },
              },
            },
          },
        },
        request: {
          include: {
            profile: { select: { displayName: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
    });

    return res.json(conversations);
  } catch (error) {
    console.error('List conversations error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list conversations' });
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                role: true,
                isVerified: true,
                profile: {
                  select: {
                    displayName: true,
                    photos: { where: { isPrimary: true }, take: 1, orderBy: { order: 'asc' } },
                  },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some((p: any) => p.userId === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    return res.json(conversation);
  } catch (error) {
    console.error('Get conversation error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get conversation' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: { participants: true },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some((p: any) => p.userId === req.userId);
    if (!isParticipant) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: req.userId!,
        content: req.body.content,
      },
    });

    await prisma.conversation.update({
      where: { id: params.id },
      data: { lastMessageAt: new Date() },
    });

    const senderProfile = await prisma.profile.findUnique({
      where: { userId: req.userId! },
      select: { displayName: true },
    });

    conversation.participants.forEach((p: any) => {
      if (p.userId !== req.userId) {
        notifyNewMessage(p.userId, senderProfile?.displayName || 'مستخدم', params.id);
      }
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to send message' });
  }
};

export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: { participants: true },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Conversation not found' });
    }

    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: params.id,
        userId: req.userId,
      },
      data: { lastReadAt: new Date() },
    });

    await prisma.message.updateMany({
      where: {
        conversationId: params.id,
        senderId: { not: req.userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to mark as read' });
  }
};
