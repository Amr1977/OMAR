import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { uploadAvatar, deleteFile } from '../../config/upload';
import { createNotification } from '../../services/notification.service';

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: '30d' as any,
  });
  return { accessToken, refreshToken };
};

const formatUser = (user: any) => ({
  id: user.id,
  firebaseUid: user.firebaseUid,
  phone: user.phone,
  email: user.email,
  roles: user.roles,
  isVerified: user.isVerified,
  isActive: user.isActive,
  isBanned: user.isBanned,
  subscriptionPlan: user.subscriptionPlan,
  subscriptionExpiry: user.subscriptionExpiry ?? null,
  language: user.language,
  avatarUrl: user.avatarUrl ?? null,
});

export const register = async (req: Request, res: Response) => {
  try {
    const { firebaseUid, phone, email, roles: reqRoles, language } = req.body;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid },
          ...(phone ? [{ phone }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    });

    const isNew = !user;

    if (!user) {
      const selectedRoles: string[] = reqRoles || ['SOCIAL'];
      if (!selectedRoles.includes('SOCIAL')) selectedRoles.unshift('SOCIAL');

      user = await prisma.user.create({
        data: {
          firebaseUid,
          phone,
          email,
          roles: selectedRoles,
          language: language || 'ar',
        },
      });

      const newUser = user;
      prisma.user.findMany({
        where: { roles: { array_contains: 'ADMIN' }, isActive: true },
        select: { id: true },
      }).then(admins => {
        if (admins.length === 0) return;
        const identifier = newUser.phone || newUser.email || 'مستخدم جديد';
        const rolesStr = (newUser.roles as string[]).filter(r => r !== 'SOCIAL').join(', ') || 'تواصل اجتماعي';
        Promise.all(admins.map(admin =>
          createNotification({
            userId: admin.id,
            type: 'new_user_signup',
            titleAr: 'مستخدم جديد',
            titleEn: 'New User Signup',
            bodyAr: `مستخدم جديد: ${identifier} — الأدوار: ${rolesStr}`,
            bodyEn: `New user: ${identifier} — Roles: ${rolesStr}`,
            data: { userId: newUser.id, phone: newUser.phone, email: newUser.email, roles: newUser.roles },
          })
        ));
      }).catch(() => {});
    } else if (user.firebaseUid !== firebaseUid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid },
      });
    }

    const tokens = generateTokens(user.id);

    return res.status(isNew ? 201 : 200).json({
      user: formatUser(user),
      ...tokens,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Registration failed' });
  }
};

export const updateRoles = async (req: AuthRequest, res: Response) => {
  try {
    const { roles } = req.body;
    if (!Array.isArray(roles)) {
      return res.status(400).json({ error: 'INVALID', message: 'roles must be an array' });
    }

    const validRoles = ['GROOM', 'GUARDIAN'];
    const filtered = [...new Set([...roles.filter((r: string) => validRoles.includes(r)), 'SOCIAL'])];
    const isAdmin = (req.roles || []).includes('ADMIN');
    if (isAdmin) filtered.push('ADMIN');

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { roles: filtered },
    });

    return res.json({ user: formatUser(user) });
  } catch (error) {
    console.error('Update roles error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update roles' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    if (!code || code.length !== 6) {
      return res.status(400).json({
        error: 'INVALID_CODE',
        messageAr: 'رمز التحقق غير صحيح',
        messageEn: 'Invalid verification code',
      });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        messageAr: 'المستخدم غير موجود',
        messageEn: 'User not found',
      });
    }

    const tokens = generateTokens(user.id);

    return res.json({
      message: 'OTP verified',
      ...tokens,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Verification failed' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'MISSING_TOKEN', message: 'Refresh token required' });
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not found' });
    }

    const tokens = generateTokens(user.id);

    return res.json(tokens);
  } catch (error) {
    return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Invalid refresh token' });
  }
};

export const logout = async (_req: AuthRequest, res: Response) => {
  return res.json({ message: 'Logged out successfully' });
};

export const updateAvatar = async (req: AuthRequest, res: Response) => {
  try {
    uploadAvatar.single('avatar')(req, res, async (err) => {
      if (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        return res.status(400).json({ error: 'UPLOAD_FAILED', message: msg });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'NO_FILE', message: 'No file provided' });
      }

      const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { avatarUrl: true } });
      if (user?.avatarUrl) deleteFile(user.avatarUrl);

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const updated = await prisma.user.update({
        where: { id: req.userId },
        data: { avatarUrl },
      });

      return res.json({ avatarUrl: updated.avatarUrl });
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update avatar' });
  }
};

export const deleteAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { avatarUrl: true } });
    if (user?.avatarUrl) {
      deleteFile(user.avatarUrl);
      await prisma.user.update({
        where: { id: req.userId },
        data: { avatarUrl: null },
      });
    }
    return res.json({ message: 'Avatar removed' });
  } catch (error) {
    console.error('Delete avatar error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete avatar' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, firebaseUid: true, phone: true, email: true, roles: true,
        isVerified: true, subscriptionPlan: true, subscriptionExpiry: true,
        language: true, isActive: true, isBanned: true, bio: true, tagline: true,
        websiteUrl: true, avatarUrl: true, isOnline: true, createdAt: true,
        profile: { include: { photos: { orderBy: { order: 'asc' }, take: 1 } } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    return res.json({
      id: user.id,
      firebaseUid: user.firebaseUid,
      phone: user.phone,
      email: user.email,
      roles: user.roles,
      isVerified: user.isVerified,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiry: user.subscriptionExpiry,
      language: user.language,
      isActive: user.isActive,
      isBanned: user.isBanned,
      hasProfile: !!user.profile,
      profileId: user.profile?.id,
      avatarUrl: user.avatarUrl ?? null,
      profilePhoto: user.avatarUrl || user.profile?.photos?.[0]?.url || null,
      bio: user.bio,
      tagline: user.tagline,
      websiteUrl: user.websiteUrl,
      isOnline: user.isOnline,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get user' });
  }
};
