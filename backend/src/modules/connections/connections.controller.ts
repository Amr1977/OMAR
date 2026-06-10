import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

export const sendConnectionRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, message } = req.body;

    if (receiverId === req.userId) {
      return res.status(400).json({ error: 'INVALID', messageAr: 'لا يمكنك الاتصال بنفسك', messageEn: 'Cannot connect with yourself' });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true, isActive: true } });
    if (!receiver || !receiver.isActive) {
      return res.status(404).json({ error: 'NOT_FOUND', messageAr: 'المستخدم غير موجود', messageEn: 'User not found' });
    }

    const existing = await prisma.connectionRequest.findUnique({
      where: { senderId_receiverId: { senderId: req.userId!, receiverId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'DUPLICATE', messageAr: 'طلب الاتصال موجود بالفعل', messageEn: 'Connection request already exists' });
    }

    const request = await prisma.connectionRequest.create({
      data: { senderId: req.userId!, receiverId, message },
    });

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'CONNECTION_REQUEST',
        titleAr: 'طلب اتصال جديد',
        titleEn: 'New connection request',
        bodyAr: 'أرسل إليك شخص ما طلب اتصال',
        bodyEn: 'Someone sent you a connection request',
        data: { requestId: request.id, senderId: req.userId },
      },
    });

    return res.status(201).json(request);
  } catch (error) {
    console.error('Send connection request error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to send connection request' });
  }
};

export const acceptConnectionRequest = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const request = await prisma.connectionRequest.findUnique({ where: { id } });

    if (!request || request.receiverId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', messageAr: 'لا يمكنك الرد على هذا الطلب', messageEn: 'Forbidden' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: 'ALREADY_PROCESSED', messageAr: 'تمت معالجة هذا الطلب', messageEn: 'Already processed' });
    }

    const updated = await prisma.connectionRequest.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });

    await prisma.notification.create({
      data: {
        userId: request.senderId,
        type: 'CONNECTION_ACCEPTED',
        titleAr: 'تم قبول طلب الاتصال',
        titleEn: 'Connection request accepted',
        bodyAr: 'قبل شخص ما طلب الاتصال الخاص بك',
        bodyEn: 'Someone accepted your connection request',
        data: { requestId: id },
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Accept connection error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to accept connection' });
  }
};

export const getMyConnections = async (req: AuthRequest, res: Response) => {
  try {
    const connections = await prisma.connectionRequest.findMany({
      where: {
        OR: [
          { senderId: req.userId, status: 'ACCEPTED' },
          { receiverId: req.userId, status: 'ACCEPTED' },
        ],
      },
      include: {
        sender: { select: { id: true, profile: { select: { displayName: true, photos: { take: 1, where: { isPrimary: true } } } } } },
        receiver: { select: { id: true, profile: { select: { displayName: true, photos: { take: 1, where: { isPrimary: true } } } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(connections);
  } catch (error) {
    console.error('Get connections error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get connections' });
  }
};

export const getPendingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.connectionRequest.findMany({
      where: { receiverId: req.userId, status: 'PENDING' },
      include: {
        sender: { select: { id: true, profile: { select: { displayName: true, photos: { take: 1, where: { isPrimary: true } } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(requests);
  } catch (error) {
    console.error('Get pending requests error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get pending requests' });
  }
};
