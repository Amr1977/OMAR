import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { Prisma } from '@prisma/client';
import { notifyProfileView } from '../../services/notification.service';

export const browseProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const {
      ageMin, ageMax, nationality, countryOfResidence, city,
      maritalStatus, marriageNumber, madhab, prayerCommitment,
      quranMemorization, education, isVerified,
      page = '1', limit = '20', sort = 'newest',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.ProfileWhereInput = {
      status: 'APPROVED',
    };

    if (ageMin) where.age = { ...(where.age as any || {}), gte: parseInt(ageMin as string) };
    if (ageMax) where.age = { ...(where.age as any || {}), lte: parseInt(ageMax as string) };
    if (nationality) where.nationality = nationality as string;
    if (countryOfResidence) where.countryOfResidence = countryOfResidence as string;
    if (city) where.city = { contains: city as string, mode: 'insensitive' };
    if (maritalStatus) where.maritalStatus = maritalStatus as any;
    if (marriageNumber) where.marriageNumber = marriageNumber as any;
    if (madhab) where.madhab = madhab as any;
    if (prayerCommitment) where.prayerCommitment = prayerCommitment as any;
    if (quranMemorization) where.quranMemorization = quranMemorization as any;
    if (education) where.education = { contains: education as string, mode: 'insensitive' };
    if (isVerified === 'true') {
      where.user = { isVerified: true };
    }

    let orderBy: Prisma.ProfileOrderByWithRelationInput = {};
    switch (sort) {
      case 'popular': orderBy = { viewCount: 'desc' }; break;
      case 'match_score': orderBy = { aiReviewScore: 'desc' }; break;
      default: orderBy = { publishedAt: 'desc' };
    }

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          photos: {
            where: { isApproved: true },
            orderBy: { order: 'asc' },
            take: 1,
          },
          user: { select: { isVerified: true, createdAt: true } },
        },
      }),
      prisma.profile.count({ where }),
    ]);

    return res.json({
      profiles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Browse profiles error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to browse profiles' });
  }
};

export const getProfileDetail = async (req: AuthRequest, res: Response) => {
  try {
    const params = req.params as { id: string };
    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      include: {
        photos: { orderBy: { order: 'asc' } },
        user: { select: { isVerified: true, createdAt: true } },
      },
    });

    if (!profile || profile.status !== 'APPROVED') {
      return res.status(404).json({
        error: 'NOT_FOUND',
        messageAr: 'الملف الشخصي غير موجود',
        messageEn: 'Profile not found',
      });
    }

    await prisma.profile.update({
      where: { id: profile.id },
      data: { viewCount: { increment: 1 } },
    });

    if (profile.userId !== req.userId) {
      const viewerProfile = await prisma.profile.findUnique({
        where: { userId: req.userId! },
        select: { displayName: true },
      });
      if (viewerProfile?.displayName) {
        notifyProfileView(profile.userId, viewerProfile.displayName);
      }
    }

    return res.json(profile);
  } catch (error) {
    console.error('Get profile detail error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get profile' });
  }
};

export const browseGroomsForGuardian = async (req: AuthRequest, res: Response) => {
  try {
    const { search, ageMin, ageMax, governorate, madhab, page = '1' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limit = 20;
    const skip = (pageNum - 1) * limit;

    const where: Prisma.ProfileWhereInput = {
      status: 'APPROVED',
      user: {
        roles: { array_contains: 'GROOM' } as any,
      },
    };

    if (ageMin) where.age = { ...((where.age as any) || {}), gte: parseInt(ageMin as string) };
    if (ageMax) where.age = { ...((where.age as any) || {}), lte: parseInt(ageMax as string) };
    if (madhab) where.madhab = madhab as any;
    if (governorate) where.residenceGovernorate = { contains: governorate as string, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { displayName: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
        { occupation: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [profiles, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          photos: { where: { isPrimary: true }, take: 1 },
          user: { select: { id: true, isVerified: true } },
        },
      }),
      prisma.profile.count({ where }),
    ]);

    return res.json({
      profiles,
      pagination: { page: pageNum, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Browse grooms error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to browse grooms' });
  }
};

export const getAiSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const { wardAge, wardNationality, wardEducation, wardMaritalStatus } = req.query;

    const profiles = await prisma.profile.findMany({
      where: { status: 'APPROVED' },
      include: {
        photos: { where: { isApproved: true }, orderBy: { order: 'asc' }, take: 1 },
        user: { select: { isVerified: true } },
      },
      take: 50,
    });

    const scored = profiles.map((p) => {
      let score = 0;
      const weights = {
        age: 0.20,
        religious: 0.30,
        location: 0.15,
        education: 0.10,
        maritalStatus: 0.15,
        completeness: 0.10,
      };

      if (wardAge) {
        const age = parseInt(wardAge as string);
        if (age >= p.wifeAgeMin && age <= p.wifeAgeMax) score += weights.age;
        else {
          const dist = Math.min(Math.abs(age - p.wifeAgeMin), Math.abs(age - p.wifeAgeMax));
          score += Math.max(0, weights.age * (1 - dist / 20));
        }
      }

      score += weights.completeness;
      if (p.user.isVerified) score += 0.05;

      if (wardNationality && p.wifeNationality) {
        if (p.wifeNationality === wardNationality || p.wifeNationality === 'any') {
          score += weights.location * 0.5;
        }
      }

      return { ...p, matchScore: Math.round(score * 100) };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);

    return res.json({ suggestions: scored.slice(0, 20) });
  } catch (error) {
    console.error('AI suggestions error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get AI suggestions' });
  }
};
