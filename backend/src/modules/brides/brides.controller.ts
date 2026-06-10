import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

const p = (req: AuthRequest) => req.params as { id: string; groomId: string };

const calculateIddahEndsAt = (
  maritalStatus: string,
  lastDivorceDate?: string | null,
  husbandDeathDate?: string | null
): { iddahEndsAt: Date | null; iddahComplete: boolean } => {
  const now = new Date();

  if (maritalStatus === 'مطلقة' && lastDivorceDate) {
    const divorceDate = new Date(lastDivorceDate);
    if (!isNaN(divorceDate.getTime())) {
      const iddahEndsAt = new Date(divorceDate);
      iddahEndsAt.setDate(iddahEndsAt.getDate() + 90);
      return { iddahEndsAt, iddahComplete: now >= iddahEndsAt };
    }
  }

  if (maritalStatus === 'أرملة' && husbandDeathDate) {
    const deathDate = new Date(husbandDeathDate);
    if (!isNaN(deathDate.getTime())) {
      const iddahEndsAt = new Date(deathDate);
      iddahEndsAt.setDate(iddahEndsAt.getDate() + 130);
      return { iddahEndsAt, iddahComplete: now >= iddahEndsAt };
    }
  }

  return { iddahEndsAt: null, iddahComplete: true };
};

export const createBride = async (req: AuthRequest, res: Response) => {
  try {
    const guardianId = req.userId!;
    const data = req.body;

    const { iddahEndsAt, iddahComplete } = calculateIddahEndsAt(
      data.maritalStatus,
      data.lastDivorceDate,
      data.husbandDeathDate
    );

    const bride = await prisma.bride.create({
      data: { guardianId, ...data, iddahEndsAt, iddahComplete },
    });
    return res.status(201).json(bride);
  } catch (error) {
    console.error('Create bride error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to create bride record' });
  }
};

export const getMyBrides = async (req: AuthRequest, res: Response) => {
  try {
    const brides = await prisma.bride.findMany({
      where: { guardianId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(brides);
  } catch (error) {
    console.error('Get brides error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get bride records' });
  }
};

export const getBride = async (req: AuthRequest, res: Response) => {
  try {
    const bride = await prisma.bride.findFirst({
      where: { id: p(req).id, guardianId: req.userId! },
    });
    if (!bride) return res.status(404).json({ error: 'NOT_FOUND', message: 'Bride record not found' });
    return res.json(bride);
  } catch (error) {
    console.error('Get bride error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get bride record' });
  }
};

export const updateBride = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.bride.findFirst({
      where: { id: p(req).id, guardianId: req.userId! },
    });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Bride record not found' });

    const data = req.body;
    const { iddahEndsAt, iddahComplete } = calculateIddahEndsAt(
      data.maritalStatus || existing.maritalStatus,
      data.lastDivorceDate !== undefined ? data.lastDivorceDate : existing.lastDivorceDate,
      data.husbandDeathDate !== undefined ? data.husbandDeathDate : existing.husbandDeathDate
    );

    const bride = await prisma.bride.update({
      where: { id: p(req).id },
      data: { ...data, iddahEndsAt, iddahComplete },
    });
    return res.json(bride);
  } catch (error) {
    console.error('Update bride error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update bride record' });
  }
};

export const deleteBride = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.bride.findFirst({
      where: { id: p(req).id, guardianId: req.userId! },
    });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Bride record not found' });

    await prisma.bride.delete({ where: { id: p(req).id } });
    return res.json({ message: 'Bride record deleted' });
  } catch (error) {
    console.error('Delete bride error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete bride record' });
  }
};

export const exposeBride = async (req: AuthRequest, res: Response) => {
  try {
    const brideId = p(req).id;
    const { groomId } = req.body;

    if (!groomId) {
      return res.status(400).json({ error: 'VALIDATION', message: 'groomId is required' });
    }

    const bride = await prisma.bride.findFirst({
      where: { id: brideId, guardianId: req.userId! },
    });
    if (!bride) return res.status(404).json({ error: 'NOT_FOUND', message: 'Bride record not found' });

    if (!bride.iddahComplete && bride.iddahEndsAt) {
      const daysRemaining = Math.ceil(
        (bride.iddahEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return res.status(403).json({
        error: 'IDDAH_INCOMPLETE',
        messageAr: `لا يمكن الإتاحة — العدة لم تنته بعد (متبقي ${daysRemaining} يوم تقريباً)`,
        messageEn: `Cannot expose — iddah period not yet complete (approx. ${daysRemaining} days remaining)`,
        iddahEndsAt: bride.iddahEndsAt,
      });
    }

    const groom = await prisma.user.findUnique({ where: { id: groomId, isActive: true } });
    if (!groom) return res.status(404).json({ error: 'NOT_FOUND', message: 'Groom not found or inactive' });

    const exposure = await prisma.brideExposure.upsert({
      where: { brideId_groomId: { brideId, groomId } },
      update: { isActive: true },
      create: { brideId, groomId, isActive: true },
    });

    return res.json(exposure);
  } catch (error) {
    console.error('Expose bride error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to expose bride record' });
  }
};

export const removeExposure = async (req: AuthRequest, res: Response) => {
  try {
    const brideId = p(req).id;
    const groomId = req.params.groomId as string;

    const bride = await prisma.bride.findFirst({
      where: { id: brideId, guardianId: req.userId! },
    });
    if (!bride) return res.status(404).json({ error: 'NOT_FOUND', message: 'Bride record not found' });

    const exposure = await prisma.brideExposure.findUnique({
      where: { brideId_groomId: { brideId, groomId } },
    });
    if (!exposure) return res.status(404).json({ error: 'NOT_FOUND', message: 'Exposure not found' });

    await prisma.brideExposure.update({
      where: { brideId_groomId: { brideId, groomId } },
      data: { isActive: false },
    });

    return res.json({ message: 'Exposure removed' });
  } catch (error) {
    console.error('Remove exposure error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to remove exposure' });
  }
};

export const getBrideExposures = async (req: AuthRequest, res: Response) => {
  try {
    const brideId = p(req).id;

    const bride = await prisma.bride.findFirst({
      where: { id: brideId, guardianId: req.userId! },
    });
    if (!bride) return res.status(404).json({ error: 'NOT_FOUND', message: 'Bride record not found' });

    const exposures = await prisma.brideExposure.findMany({
      where: { brideId },
      include: {
        groom: {
          select: { id: true, profile: { select: { displayName: true } }, phone: true, email: true },
        },
      },
      orderBy: { exposedAt: 'desc' },
    });

    return res.json(exposures);
  } catch (error) {
    console.error('Get exposures error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get exposures' });
  }
};

export const getVisibleBrides = async (req: AuthRequest, res: Response) => {
  try {
    const groomId = req.userId!;
    const {
      ageMin, ageMax, maritalStatus, education,
      prayerCommitment, hijabType, skinColor,
      originGovernorate, residenceGovernorate,
      acceptPolygamy, wantChildren,
      search,
      page = '1', limit = '20', sort = 'newest',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      exposures: {
        some: {
          groomId,
          isActive: true,
        },
      },
      status: 'ACTIVE',
      guardian: { isActive: true },
    };

    if (ageMin) where.age = { ...(where.age || {}), gte: parseInt(ageMin as string) };
    if (ageMax) where.age = { ...(where.age || {}), lte: parseInt(ageMax as string) };
    if (maritalStatus) where.maritalStatus = maritalStatus as string;
    if (education) where.education = { contains: education as string, mode: 'insensitive' };
    if (prayerCommitment) where.prayerCommitment = prayerCommitment as string;
    if (hijabType) where.hijabType = hijabType as string;
    if (skinColor) where.skinColor = skinColor as string;
    if (originGovernorate) where.originGovernorate = { contains: originGovernorate as string, mode: 'insensitive' };
    if (residenceGovernorate) where.residenceGovernorate = { contains: residenceGovernorate as string, mode: 'insensitive' };
    if (acceptPolygamy) where.acceptPolygamy = acceptPolygamy as string;
    if (wantChildren) where.wantChildren = wantChildren as string;

    if (search) {
      where.OR = [
        { education: { contains: search as string, mode: 'insensitive' } },
        { occupation: { contains: search as string, mode: 'insensitive' } },
        { notes: { contains: search as string, mode: 'insensitive' } },
        { originGovernorate: { contains: search as string, mode: 'insensitive' } },
        { residenceGovernorate: { contains: search as string, mode: 'insensitive' } },
        { area: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'age_asc') orderBy = { age: 'asc' };
    else if (sort === 'age_desc') orderBy = { age: 'desc' };

    const [brides, total] = await Promise.all([
      prisma.bride.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          guardian: {
            select: {
              id: true,
              profile: { select: { id: true, displayName: true } },
            },
          },
          exposures: {
            where: { groomId, isActive: true },
            select: { exposedAt: true },
            take: 1,
          },
          contactRequests: {
            where: { senderId: groomId },
            select: { id: true, status: true },
            take: 1,
          },
        },
      }),
      prisma.bride.count({ where }),
    ]);

    const enriched = brides.map(b => ({
      ...b,
      guardianProfileId: (b as any).guardian?.profile?.id || null,
      requestStatus: (b as any).contactRequests?.[0]?.status || null,
      exposedAt: (b as any).exposures?.[0]?.exposedAt || null,
    }));

    return res.json({
      brides: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get visible brides error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get visible brides' });
  }
};
