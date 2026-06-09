import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

export const startDirectConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { recipientId } = req.body;

    if (recipientId === req.userId) {
      return res.status(400).json({ error: 'INVALID', messageAr: 'لا يمكنك مراسلة نفسك', messageEn: 'Cannot message yourself' });
    }

    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient || !recipient.isActive) {
      return res.status(404).json({ error: 'NOT_FOUND', messageAr: 'المستخدم غير موجود', messageEn: 'User not found' });
    }

    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        participants: { some: { userId: { in: [req.userId!, recipientId] } } },
      },
      include: { participants: true },
    });

    if (existing && existing.participants.length === 2) {
      const pIds = existing.participants.map(p => p.userId);
      if (pIds.includes(req.userId!) && pIds.includes(recipientId)) {
        return res.json(existing);
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        participants: {
          createMany: {
            data: [{ userId: req.userId! }, { userId: recipientId }],
          },
        },
      },
      include: { participants: true },
    });

    return res.status(201).json(conversation);
  } catch (error) {
    console.error('Start direct conversation error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to start conversation' });
  }
};
