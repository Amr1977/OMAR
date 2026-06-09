import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { notifyContactRequest, notifyRequestAccepted } from '../../services/notification.service';

const p = (req: AuthRequest) => req.params as { id: string };

export const sendRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { profileId, brideId, message } = req.body;

    const senderProfile = await prisma.profile.findUnique({
      where: { userId: req.userId! },
      select: { displayName: true, status: true },
    });
    if (!senderProfile || senderProfile.status !== 'APPROVED') {
      return res.status(403).json({
        error: 'PROFILE_REQUIRED',
        messageAr: 'يجب أن يكون لديك ملف شخصي معتمد لإرسال طلب تواصل',
        messageEn: 'You must have an approved profile to send a contact request',
      });
    }

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

    if (brideId) {
      const exposure = await prisma.brideExposure.findUnique({
        where: { brideId_groomId: { brideId, groomId: req.userId! } },
      });
      if (!exposure || !exposure.isActive) {
        return res.status(403).json({
          error: 'NOT_EXPOSED',
          messageAr: 'هذا السجل غير متاح لك',
          messageEn: 'This bride record is not exposed to you',
        });
      }
      const bride = await prisma.bride.findFirst({
        where: { id: brideId, guardianId: profile.userId },
      });
      if (!bride) {
        return res.status(400).json({
          error: 'MISMATCH',
          messageAr: 'السجل لا ينتمي لولي الأمر هذا',
          messageEn: 'Bride record does not belong to this guardian',
        });
      }
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
        brideId: brideId || null,
        message,
      },
      include: {
        profile: { select: { displayName: true } },
        bride: { select: { id: true, age: true, residenceGovernorate: true } },
      },
    });

    await prisma.profile.update({
      where: { id: profileId },
      data: { requestCount: { increment: 1 } },
    });

    notifyContactRequest(profile.userId, senderProfile.displayName || 'مستخدم', req.userId);

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
        bride: { select: { id: true, age: true, residenceGovernorate: true } },
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

    const receiverProfile = await prisma.profile.findUnique({
      where: { userId: req.userId! },
      select: { displayName: true },
    });

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

    notifyRequestAccepted(request.senderId, receiverProfile?.displayName || 'مستخدم');

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
