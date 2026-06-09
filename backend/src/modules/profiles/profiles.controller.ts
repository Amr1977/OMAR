import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { runAiReview } from '../../services/aiReview.service';

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
        dateOfBirth: req.body.dateOfBirth || null,
        weight: req.body.weight || null,
        height: req.body.height || null,
        skinColor: req.body.skinColor || null,
        beard: req.body.beard || null,
        sports: req.body.sports || null,
        healthIssues: req.body.healthIssues || null,
        nationality: req.body.nationality,
        countryOfResidence: req.body.countryOfResidence,
        city: req.body.city,
        education: req.body.education || '',
        educationLevel: req.body.educationLevel || null,
        occupation: req.body.occupation || '',
        workType: req.body.workType || null,
        incomeLevel: req.body.incomeLevel || null,
        maritalStatus: req.body.maritalStatus || 'SINGLE',
        marriageNumber: req.body.marriageNumber || 'FIRST',
        lastDivorceDate: req.body.lastDivorceDate || null,
        hasChildren: req.body.hasChildren ?? false,
        numberOfChildren: req.body.numberOfChildren || null,
        childrenDetails: req.body.childrenDetails || null,
        childrenCustody: req.body.childrenCustody || null,
        wantsPolygamy: req.body.wantsPolygamy ?? null,
        wantsChildren: req.body.wantsChildren ?? null,
        fatherOccupation: req.body.fatherOccupation || null,
        motherOccupation: req.body.motherOccupation || null,
        siblingsCount: req.body.siblingsCount || null,
        siblingsEducation: req.body.siblingsEducation || null,
        originGovernorate: req.body.originGovernorate || null,
        residenceGovernorate: req.body.residenceGovernorate || null,
        areaType: req.body.areaType || null,
        marriedResidence: req.body.marriedResidence || null,
        housingType: req.body.housingType || null,
        housingPrivacy: req.body.housingPrivacy || null,
        madhab: req.body.madhab || 'HANAFI',
        prayerCommitment: req.body.prayerCommitment || 'ALWAYS',
        quranMemorization: req.body.quranMemorization || 'NONE',
        religiousDescription: req.body.religiousDescription || null,
        smoking: req.body.smoking || null,
        selfIntroduction: req.body.selfIntroduction || '',
        additionalNotes: req.body.additionalNotes || null,
        wifeAgeMin: req.body.wifeAgeMin || 18,
        wifeAgeMax: req.body.wifeAgeMax || 35,
        wifeNationality: req.body.wifeNationality || null,
        wifeCountry: req.body.wifeCountry || null,
        wifeEducation: req.body.wifeEducation || null,
        wifeMaritalStatus: req.body.wifeMaritalStatus || 'any',
        wifeHasChildren: req.body.wifeHasChildren || 'no_preference',
        wifeReligiousLevel: req.body.wifeReligiousLevel || null,
        wifePreferredSkinColor: req.body.wifePreferredSkinColor || null,
        wifePreferredHijab: req.body.wifePreferredHijab || null,
        wifePreferredWork: req.body.wifePreferredWork || null,
        wifeAcceptDivorcedWithChildren: req.body.wifeAcceptDivorcedWithChildren || null,
        wifeAcceptDivorcedChildrenCustody: req.body.wifeAcceptDivorcedChildrenCustody || null,
        wifeAcceptOtherCity: req.body.wifeAcceptOtherCity ?? null,
        wifeFurnishApartment: req.body.wifeFurnishApartment || null,
        wifeAdditionalNotes: req.body.wifeAdditionalNotes || null,
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
        user: { select: { id: true, isVerified: true, roles: true } },
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
    if (req.roles?.some(r => ['GUARDIAN', 'ADMIN'].includes(r))) {
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

    // Sanitize empty strings to null/undefined for non-string fields
    const intFields = ['age', 'weight', 'height', 'numberOfChildren', 'siblingsCount', 'wifeAgeMin', 'wifeAgeMax'];
    const boolFields = ['hasChildren', 'wantsPolygamy', 'wantsChildren', 'wifeAcceptOtherCity'];
    for (const key of Object.keys(profileData)) {
      const val = profileData[key];
      if (val === '' || val === undefined) {
        if (intFields.includes(key) || boolFields.includes(key)) {
          profileData[key] = null;
        }
      }
    }

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

    const { cloudinaryUrl, cloudinaryId } = req.body;

    if (!cloudinaryUrl) {
      return res.status(400).json({
        error: 'CLOUDINARY_REQUIRED',
        messageAr: 'يجب رفع الصورة عبر Cloudinary',
        messageEn: 'Photo must be uploaded via Cloudinary. Send cloudinaryUrl and cloudinaryId.',
      });
    }

    if (!cloudinaryUrl.includes('cloudinary.com') && !cloudinaryUrl.includes('res.cloudinary')) {
      return res.status(400).json({
        error: 'INVALID_URL',
        messageAr: 'رابط الصورة غير صالح',
        messageEn: 'Invalid Cloudinary URL',
      });
    }

    const photo = await prisma.profilePhoto.create({
      data: {
        profileId: params.id,
        url: cloudinaryUrl,
        cloudinaryId: cloudinaryId || null,
        isPrimary: photoCount === 0,
        order: photoCount,
        isApproved: false,
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

    if (photo.profileId !== params.id) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        messageAr: 'الصورة لا تنتمي لهذا الملف',
        messageEn: 'Photo does not belong to this profile',
      });
    }

    const wasPrimary = photo.isPrimary;

    await prisma.profilePhoto.delete({
      where: { id: params.photoId },
    });

    // Reorder remaining photos
    const remaining = await prisma.profilePhoto.findMany({
      where: { profileId: params.id },
      orderBy: { order: 'asc' },
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].order !== i) {
        await prisma.profilePhoto.update({
          where: { id: remaining[i].id },
          data: { order: i },
        });
      }
    }

    if (wasPrimary && remaining.length > 0) {
      await prisma.profilePhoto.update({
        where: { id: remaining[0].id },
        data: { isPrimary: true },
      });
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

    if (profile.photos.length === 0) {
      return res.status(400).json({
        error: 'NO_PHOTOS',
        messageAr: 'يجب إضافة صورة واحدة على الأقل قبل النشر',
        messageEn: 'At least one photo is required before submitting for review',
      });
    }

    await prisma.profile.update({
      where: { id: params.id },
      data: { status: 'PENDING_AI_REVIEW' },
    });

    runAiReview(params.id, profile).catch(err =>
      console.error('AI review failed for profile', params.id, err)
    );

    return res.json({ message: 'Profile submitted for review', status: 'PENDING_AI_REVIEW' });
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
