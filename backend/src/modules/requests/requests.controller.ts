import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

const p = (req: AuthRequest) => req.params as { id: string };

export const sendRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId, message } = req.body;

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: { user: true },
    });

    if (!profile || profile.status !== 'APPROVED') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        messageAr: 'الملف الشخصي غير موجود',
        messageEn: 'Profile not found',
      });
    }

    const existing = await prisma.contactRequest.findUnique({
      where: { senderId_profileId: { senderId: req.userId!, profileId } },
    });

    if (existing) {
      return res.status(409).json({
        error: 'DUPLICATE_REQUEST',
        messageAr: 'لقد أرسلت طلب تواصل لهذا الملف مسبقاً',
        messageEn: 'You have already sent a request to this profile',
      });
    }

    const request = await prisma.contactRequest.create({
      data: {
        senderId: req.userId!,
        profileId,
        receiverId: profile.userId,
        message,
      },
      include: {
        profile: { select: { displayName: true } },
        sender: { select: { id: true } },
      },
    });

    await prisma.profile.update({
      where: { id: profileId },
      data: { requestCount: { increment: 1 } },
    });

    return res.status(201).json(request);
  } catch (error) {
    console.error('Send request error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to send request' });
  }
};

export const getSentRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.contactRequest.findMany({
      where: { senderId: req.userId },
      include: {
        profile: {
          select: {
            id: true,
            displayName: true,
            age: true,
            city: true,
            nationality: true,
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
        conversation: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(requests);
  } catch (error) {
    console.error('Get sent requests error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get sent requests' });
  }
};

export const getReceivedRequests = async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.contactRequest.findMany({
      where: { receiverId: req.userId },
      include: {
        sender: { select: { id: true, isVerified: true } },
        conversation: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(requests);
  } catch (error) {
    console.error('Get received requests error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get received requests' });
  }
};

export const acceptRequest = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const request = await prisma.contactRequest.findUnique({
      where: { id: params.id },
    });

    if (!request || request.receiverId !== req.userId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'لا يمكنك الرد على هذا الطلب',
        messageEn: 'You cannot respond to this request',
      });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({
        error: 'ALREADY_PROCESSED',
        messageAr: 'تمت معالجة هذا الطلب مسبقاً',
        messageEn: 'This request has already been processed',
      });
    }

    const updated = await prisma.contactRequest.update({
      where: { id: params.id },
      data: { status: 'ACCEPTED' },
    });

    const conversation = await prisma.conversation.create({
      data: {
        requestId: updated.id,
        participants: {
          createMany: {
            data: [
              { userId: request.senderId },
              { userId: request.receiverId },
            ],
          },
        },
      },
    });

    return res.json({ request: updated, conversation });
  } catch (error) {
    console.error('Accept request error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to accept request' });
  }
};

export const rejectRequest = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const request = await prisma.contactRequest.findUnique({
      where: { id: params.id },
    });

    if (!request || request.receiverId !== req.userId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'لا يمكنك الرد على هذا الطلب',
        messageEn: 'You cannot respond to this request',
      });
    }

    const updated = await prisma.contactRequest.update({
      where: { id: params.id },
      data: { status: 'REJECTED' },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Reject request error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to reject request' });
  }
};
