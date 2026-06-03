import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

const p = (req: AuthRequest) => req.params as { id: string; photoId: string };

export const createProfile = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.profile.findUnique({ where: { userId: req.userId } });
    if (existing) {
      return res.status(409).json({
        error: 'PROFILE_EXISTS',
        messageAr: 'لديك ملف شخصي بالفعل',
        messageEn: 'You already have a profile',
      });
    }

    const profile = await prisma.profile.create({
      data: {
        userId: req.userId!,
        displayName: req.body.displayName,
        age: req.body.age,
        nationality: req.body.nationality,
        countryOfResidence: req.body.countryOfResidence,
        city: req.body.city,
        education: req.body.education,
        occupation: req.body.occupation,
        maritalStatus: req.body.maritalStatus,
        marriageNumber: req.body.marriageNumber,
        hasChildren: req.body.hasChildren,
        numberOfChildren: req.body.numberOfChildren,
        madhab: req.body.madhab,
        prayerCommitment: req.body.prayerCommitment,
        quranMemorization: req.body.quranMemorization,
        religiousDescription: req.body.religiousDescription,
        selfIntroduction: req.body.selfIntroduction,
        additionalNotes: req.body.additionalNotes,
        wifeAgeMin: req.body.wifeAgeMin,
        wifeAgeMax: req.body.wifeAgeMax,
        wifeNationality: req.body.wifeNationality,
        wifeCountry: req.body.wifeCountry,
        wifeEducation: req.body.wifeEducation,
        wifeMaritalStatus: req.body.wifeMaritalStatus,
        wifeHasChildren: req.body.wifeHasChildren,
        wifeReligiousLevel: req.body.wifeReligiousLevel,
        wifeAdditionalNotes: req.body.wifeAdditionalNotes,
      },
      include: { photos: true },
    });

    return res.status(201).json(profile);
  } catch (error) {
    console.error('Create profile error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to create profile' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      include: {
        photos: { orderBy: { order: 'asc' } },
        user: { select: { id: true, isVerified: true, role: true } },
      },
    });

    if (!profile) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        messageAr: 'الملف الشخصي غير موجود',
        messageEn: 'Profile not found',
      });
    }

    // Increment view count if viewer is a guardian
    if (req.userRole === 'GUARDIAN' || req.userRole === 'BOTH') {
      await prisma.profile.update({
        where: { id: profile.id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const profile = await prisma.profile.findUnique({ where: { id: params.id } });
    if (!profile || profile.userId !== req.userId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'لا يمكنك تعديل هذا الملف',
        messageEn: 'You cannot edit this profile',
      });
    }

    const { photos, ...profileData } = req.body;
    const updated = await prisma.profile.update({
      where: { id: params.id },
      data: {
        ...profileData,
        status: 'DRAFT',
      },
      include: { photos: true },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update profile' });
  }
};

export const deleteProfile = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const profile = await prisma.profile.findUnique({ where: { id: params.id } });
    if (!profile || profile.userId !== req.userId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'لا يمكنك حذف هذا الملف',
        messageEn: 'You cannot delete this profile',
      });
    }

    await prisma.profile.delete({ where: { id: params.id } });

    return res.json({ message: 'Profile deleted' });
  } catch (error) {
    console.error('Delete profile error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete profile' });
  }
};

export const uploadPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const profile = await prisma.profile.findUnique({ where: { id: params.id } });
    if (!profile || profile.userId !== req.userId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'لا يمكنك تعديل هذا الملف',
        messageEn: 'You cannot edit this profile',
      });
    }

    const photoCount = await prisma.profilePhoto.count({ where: { profileId: params.id } });
    if (photoCount >= 6) {
      return res.status(400).json({
        error: 'MAX_PHOTOS',
        messageAr: 'الحد الأقصى 6 صور',
        messageEn: 'Maximum 6 photos allowed',
      });
    }

    let url = req.body.url;
    let cloudinaryId = req.body.cloudinaryId;

    if (!url && req.file) {
      url = `/uploads/${req.file.filename}`;
    }

    if (!url) {
      return res.status(400).json({
        error: 'NO_PHOTO',
        messageAr: 'يرجى اختيار صورة',
        messageEn: 'Please select a photo',
      });
    }

    const photo = await prisma.profilePhoto.create({
      data: {
        profileId: params.id,
        url,
        cloudinaryId,
        isPrimary: photoCount === 0,
        order: photoCount,
        isApproved: true,
      },
    });

    return res.status(201).json(photo);
  } catch (error) {
    console.error('Upload photo error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to upload photo' });
  }
};

export const deletePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const profile = await prisma.profile.findUnique({ where: { id: params.id } });
    if (!profile || profile.userId !== req.userId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'لا يمكنك تعديل هذا الملف',
        messageEn: 'You cannot edit this profile',
      });
    }

    const photo = await prisma.profilePhoto.findUnique({ where: { id: params.photoId } });
    if (!photo) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        messageAr: 'الصورة غير موجودة',
        messageEn: 'Photo not found',
      });
    }

    const wasPrimary = photo.isPrimary;

    await prisma.profilePhoto.delete({
      where: { id: params.photoId },
    });

    if (wasPrimary) {
      const nextPhoto = await prisma.profilePhoto.findFirst({
        where: { profileId: params.id },
        orderBy: { order: 'asc' },
      });
      if (nextPhoto) {
        await prisma.profilePhoto.update({
          where: { id: nextPhoto.id },
          data: { isPrimary: true },
        });
      }
    }

    return res.json({ message: 'Photo deleted' });
  } catch (error) {
    console.error('Delete photo error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete photo' });
  }
};

export const setPrimaryPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const profile = await prisma.profile.findUnique({ where: { id: params.id } });
    if (!profile || profile.userId !== req.userId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'لا يمكنك تعديل هذا الملف',
        messageEn: 'You cannot edit this profile',
      });
    }

    const photo = await prisma.profilePhoto.findUnique({ where: { id: params.photoId } });
    if (!photo || photo.profileId !== params.id) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        messageAr: 'الصورة غير موجودة',
        messageEn: 'Photo not found',
      });
    }

    await prisma.profilePhoto.updateMany({
      where: { profileId: params.id },
      data: { isPrimary: false },
    });

    const updated = await prisma.profilePhoto.update({
      where: { id: params.photoId },
      data: { isPrimary: true },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Set primary photo error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to set primary photo' });
  }
};

export const submitForReview = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      include: { photos: true },
    });

    if (!profile || profile.userId !== req.userId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'لا يمكنك تعديل هذا الملف',
        messageEn: 'You cannot edit this profile',
      });
    }

    await prisma.profile.update({
      where: { id: params.id },
      data: { status: 'PENDING_AI_REVIEW' },
    });

    // AI review will be processed asynchronously
    // For now, auto-approve
    const pid = params.id;
    setTimeout(async () => {
      try {
        await prisma.profile.update({
          where: { id: pid },
          data: {
            status: 'APPROVED',
            aiReviewScore: 85,
            aiReviewNotes: 'Auto-approved (AI review placeholder)',
            aiReviewedAt: new Date(),
            publishedAt: new Date(),
          },
        });
      } catch (e) {
        console.error('AI review callback error:', e);
      }
    }, 1000);

    return res.json({
      message: 'Profile submitted for review',
      status: 'PENDING_AI_REVIEW',
    });
  } catch (error) {
    console.error('Submit for review error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to submit for review' });
  }
};

export const toggleVisibility = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const profile = await prisma.profile.findUnique({ where: { id: params.id } });
    if (!profile || profile.userId !== req.userId) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'لا يمكنك تعديل هذا الملف',
        messageEn: 'You cannot edit this profile',
      });
    }

    const visible = req.body.visible === true;
    const updated = await prisma.profile.update({
      where: { id: params.id },
      data: {
        status: visible ? 'APPROVED' : 'DRAFT',
        publishedAt: visible ? new Date() : null,
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('Toggle visibility error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to toggle visibility' });
  }
};

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId },
      include: { photos: { orderBy: { order: 'asc' } } },
    });

    if (!profile) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        messageAr: 'ليس لديك ملف شخصي بعد',
        messageEn: 'You do not have a profile yet',
      });
    }

    return res.json(profile);
  } catch (error) {
    console.error('Get my profile error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get profile' });
  }
};
