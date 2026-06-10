import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { notifyContactRequest, notifyRequestAccepted, createNotification } from '../../services/notification.service';

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
        bride: {
          select: {
            id: true,
            age: true,
            residenceGovernorate: true,
            maritalStatus: true,
            prayerCommitment: true,
            hijabType: true,
          },
        },
        receiver: {
          select: {
            id: true,
            profile: {
              select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } },
            },
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
        sender: {
          select: {
            id: true,
            isVerified: true,
            createdAt: true,
            profile: {
              select: {
                id: true,
                displayName: true,
                age: true,
                city: true,
                nationality: true,
                residenceGovernorate: true,
                occupation: true,
                education: true,
                maritalStatus: true,
                madhab: true,
                prayerCommitment: true,
                quranMemorization: true,
                selfIntroduction: true,
                photos: { where: { isPrimary: true }, take: 1 },
                aiReviewScore: true,
                status: true,
              },
            },
          },
        },
        bride: {
          select: {
            id: true,
            age: true,
            residenceGovernorate: true,
            maritalStatus: true,
            prayerCommitment: true,
            hijabType: true,
          },
        },
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

export const guardianPropose = async (req: AuthRequest, res: Response) => {
  try {
    const { groomProfileId, brideId, guardianNote } = req.body;

    if (!groomProfileId || !brideId) {
      return res.status(400).json({
        error: 'VALIDATION',
        messageAr: 'يجب تحديد ملف العريس وسجل العروس',
        messageEn: 'groomProfileId and brideId are required',
      });
    }

    const bride = await prisma.bride.findFirst({
      where: { id: brideId, guardianId: req.userId! },
    });
    if (!bride) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'هذا السجل لا ينتمي لك',
        messageEn: 'Bride record not found or not yours',
      });
    }

    if (!bride.iddahComplete && bride.iddahEndsAt) {
      const daysRemaining = Math.ceil(
        (bride.iddahEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return res.status(403).json({
        error: 'IDDAH_INCOMPLETE',
        messageAr: `لا يمكن إرسال التقدم — العدة لم تنته بعد (متبقي ${daysRemaining} يوم تقريباً)`,
        iddahEndsAt: bride.iddahEndsAt,
      });
    }

    const groomProfile = await prisma.profile.findUnique({
      where: { id: groomProfileId },
      include: { user: { select: { id: true, isActive: true } } },
    });
    if (!groomProfile || groomProfile.status !== 'APPROVED' || !groomProfile.user.isActive) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        messageAr: 'ملف العريس غير موجود أو غير معتمد',
        messageEn: 'Groom profile not found or not approved',
      });
    }

    const existing = await prisma.contactRequest.findFirst({
      where: {
        senderId: req.userId!,
        profileId: groomProfileId,
        brideId,
        initiatedBy: 'GUARDIAN',
      },
    });
    if (existing) {
      return res.status(409).json({
        error: 'DUPLICATE',
        messageAr: 'لقد أرسلت تقدماً لهذا العريس عن هذه الموليه مسبقاً',
        messageEn: 'You have already proposed to this groom for this bride',
      });
    }

    const reverseRequest = await prisma.contactRequest.findFirst({
      where: {
        senderId: groomProfile.user.id,
        receiverId: req.userId!,
        brideId,
        initiatedBy: 'GROOM',
      },
    });
    if (reverseRequest) {
      return res.status(409).json({
        error: 'REVERSE_EXISTS',
        messageAr: 'العريس أرسل لك طلباً بالفعل عن هذه الموليه — راجع صندوق الطلبات',
        messageEn: 'Groom already sent you a request for this bride — check your inbox',
        existingRequestId: reverseRequest.id,
      });
    }

    const guardianProfile = await prisma.profile.findUnique({
      where: { userId: req.userId! },
      select: { id: true, displayName: true },
    });

    const proposal = await prisma.contactRequest.create({
      data: {
        senderId: req.userId!,
        profileId: groomProfileId,
        receiverId: groomProfile.user.id,
        brideId,
        initiatedBy: 'GUARDIAN',
        guardianNote: guardianNote?.trim() || null,
        message: guardianNote?.trim() || null,
      },
      include: {
        bride: { select: { id: true, age: true, residenceGovernorate: true } },
        profile: { select: { displayName: true } },
      },
    });

    const guardianName = guardianProfile?.displayName || 'ولي أمر';
    createNotification({
      userId: groomProfile.user.id,
      type: 'guardian_proposal',
      titleAr: 'تقدم ولي أمر',
      titleEn: 'Guardian Proposal',
      bodyAr: `${guardianName} يرغب في التعريف بموليته`,
      bodyEn: `${guardianName} would like to introduce their ward`,
      data: { proposalId: proposal.id, guardianName, brideId, groomProfileId },
    });

    return res.status(201).json(proposal);
  } catch (error) {
    console.error('Guardian propose error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to send proposal' });
  }
};

export const getGroomInbox = async (req: AuthRequest, res: Response) => {
  try {
    const receivedProposals = await prisma.contactRequest.findMany({
      where: { receiverId: req.userId, initiatedBy: 'GUARDIAN' },
      include: {
        sender: {
          select: {
            id: true,
            isVerified: true,
            profile: {
              select: {
                displayName: true,
                age: true,
                photos: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        bride: {
          select: {
            id: true,
            age: true,
            residenceGovernorate: true,
            maritalStatus: true,
            prayerCommitment: true,
            hijabType: true,
            skinColor: true,
            education: true,
            wantChildren: true,
            acceptPolygamy: true,
          },
        },
        conversation: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const sentRequests = await prisma.contactRequest.findMany({
      where: { senderId: req.userId, initiatedBy: 'GROOM' },
      include: {
        receiver: {
          select: {
            id: true,
            profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } },
          },
        },
        bride: {
          select: {
            id: true,
            age: true,
            residenceGovernorate: true,
            maritalStatus: true,
            prayerCommitment: true,
            hijabType: true,
          },
        },
        conversation: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ receivedProposals, sentRequests });
  } catch (error) {
    console.error('Get groom inbox error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get groom inbox' });
  }
};

export const getGuardianDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const guardianId = req.userId!;

    const [bridesCount, activeExposures, pendingRequests, activeConversations, matchedBrides] = await Promise.all([
      prisma.bride.count({ where: { guardianId, status: 'ACTIVE' } }),
      prisma.brideExposure.count({ where: { bride: { guardianId }, isActive: true } }),
      prisma.contactRequest.count({ where: { receiverId: guardianId, status: 'PENDING' } }),
      prisma.conversation.count({
        where: { participants: { some: { userId: guardianId } } },
      }),
      prisma.bride.count({ where: { guardianId, status: 'MATCHED' } }),
    ]);

    const recentRequests = await prisma.contactRequest.findMany({
      where: { receiverId: guardianId, status: 'PENDING' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { displayName: true, age: true, photos: { where: { isPrimary: true }, take: 1 } } },
          },
        },
        bride: { select: { id: true, age: true, residenceGovernorate: true } },
      },
    });

    const brides = await prisma.bride.findMany({
      where: { guardianId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { exposures: true, contactRequests: true } },
      },
    });

    return res.json({
      stats: { bridesCount, activeExposures, pendingRequests, activeConversations, matchedBrides },
      recentRequests,
      brides,
    });
  } catch (error) {
    console.error('Guardian dashboard error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get guardian dashboard' });
  }
};

export const getGroomDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const groomId = req.userId!;

    const profile = await prisma.profile.findUnique({
      where: { userId: groomId },
      select: { id: true, status: true, displayName: true, aiReviewScore: true, viewCount: true, requestCount: true },
    });

    const [exposedBridesCount, sentRequestsCount, pendingProposals, activeConversations] = await Promise.all([
      prisma.brideExposure.count({ where: { groomId, isActive: true } }),
      prisma.contactRequest.count({ where: { senderId: groomId } }),
      prisma.contactRequest.count({ where: { receiverId: groomId, status: 'PENDING', initiatedBy: 'GUARDIAN' } }),
      prisma.conversation.count({ where: { participants: { some: { userId: groomId } } } }),
    ]);

    const recentExposures = await prisma.brideExposure.findMany({
      where: { groomId, isActive: true },
      take: 5,
      orderBy: { exposedAt: 'desc' },
      include: {
        bride: {
          select: {
            id: true,
            age: true,
            residenceGovernorate: true,
            maritalStatus: true,
            prayerCommitment: true,
            hijabType: true,
          },
        },
      },
    });

    return res.json({
      profile,
      stats: { exposedBridesCount, sentRequestsCount, pendingProposals, activeConversations },
      recentExposures,
      profileComplete: !!profile && profile.status === 'APPROVED',
    });
  } catch (error) {
    console.error('Groom dashboard error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get groom dashboard' });
  }
};

export const markMarriageSuccess = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId, brideId } = req.body;

    if (brideId) {
      const bride = await prisma.bride.findFirst({
        where: { id: brideId, guardianId: req.userId },
      });
      if (bride) {
        await prisma.bride.update({
          where: { id: brideId },
          data: { status: 'MATCHED' },
        });
      }
    }

    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: true },
      });
      if (conversation) {
        const otherParticipantId = conversation.participants
          .find(p => p.userId !== req.userId)?.userId;
        if (otherParticipantId) {
          createNotification({
            userId: otherParticipantId,
            type: 'marriage_success',
            titleAr: 'مبارك عليكم 🌸',
            titleEn: 'Marriage Success',
            bodyAr: 'تم تسجيل الزواج بحمد الله — بارك الله لكم وبارك عليكم وجمع بينكم في خير',
            bodyEn: 'Marriage registered successfully — may Allah bless your union',
            data: { conversationId },
          });
        }
      }
    }

    return res.json({
      message: 'بارك الله لكم وبارك عليكم وجمع بينكم في خير',
    });
  } catch (error) {
    console.error('Marriage success error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to mark success' });
  }
};
