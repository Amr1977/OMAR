import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

export const createServiceRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, title, description, budgetMin, budgetMax, currency, governorate, city, urgency } = req.body;

    if (!categoryId || !title || !description) {
      return res.status(400).json({ error: 'VALIDATION', messageAr: 'البيانات المطلوبة ناقصة', messageEn: 'Missing required fields' });
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        userId: req.userId!,
        categoryId,
        title,
        description,
        budgetMin: budgetMin ? parseFloat(budgetMin) : null,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        currency: currency || 'EGP',
        governorate,
        city,
        urgency: urgency || 'NORMAL',
      },
      include: { category: true, user: { select: { id: true, profile: { select: { displayName: true } } } } },
    });

    return res.status(201).json(serviceRequest);
  } catch (error) {
    console.error('Create service request error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to create service request' });
  }
};

export const browseServiceRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, governorate, urgency, page = '1' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limit = 20;
    const skip = (pageNum - 1) * limit;

    const where: any = { status: 'OPEN' };
    if (categoryId) where.categoryId = categoryId as string;
    if (governorate) where.governorate = { contains: governorate as string, mode: 'insensitive' };
    if (urgency) where.urgency = urgency as string;

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          user: { select: { id: true, profile: { select: { displayName: true } } } },
          _count: { select: { offers: true } },
        },
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return res.json({ requests, pagination: { page: pageNum, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Browse service requests error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to browse service requests' });
  }
};

export const submitOffer = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { price, message } = req.body;

    const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!serviceRequest || serviceRequest.status !== 'OPEN') {
      return res.status(404).json({ error: 'NOT_FOUND', messageAr: 'الطلب غير موجود أو مغلق', messageEn: 'Request not found or closed' });
    }
    if (serviceRequest.userId === req.userId) {
      return res.status(400).json({ error: 'INVALID', messageAr: 'لا يمكنك تقديم عرض على طلبك الخاص', messageEn: 'Cannot offer on your own request' });
    }

    const existing = await prisma.serviceOffer.findUnique({
      where: { serviceRequestId_providerId: { serviceRequestId: id, providerId: req.userId! } },
    });
    if (existing) {
      return res.status(409).json({ error: 'DUPLICATE', messageAr: 'لقد قدمت عرضاً بالفعل', messageEn: 'You already submitted an offer' });
    }

    const offer = await prisma.serviceOffer.create({
      data: { serviceRequestId: id, providerId: req.userId!, price: parseFloat(price), message },
    });

    await prisma.notification.create({
      data: {
        userId: serviceRequest.userId,
        type: 'SERVICE_OFFER',
        titleAr: 'عرض جديد على طلبك',
        titleEn: 'New offer on your request',
        bodyAr: `تلقيت عرضاً بسعر ${price} جنيه`,
        bodyEn: `You received an offer for ${price} EGP`,
        data: { offerId: offer.id, serviceRequestId: id },
      },
    });

    return res.status(201).json(offer);
  } catch (error) {
    console.error('Submit offer error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to submit offer' });
  }
};
