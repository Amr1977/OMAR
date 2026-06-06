import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

const MODULE_ROLE_MAP: Record<string, string[]> = {
  marriage: ['GROOM'],
  guardian: ['GUARDIAN'],
};

const deriveRole = (modules: string[]): string => {
  const hasMarriage = modules.includes('marriage');
  const hasGuardian = modules.includes('guardian');
  if (hasMarriage && hasGuardian) return 'BOTH';
  if (hasMarriage) return 'GROOM';
  if (hasGuardian) return 'GUARDIAN';
  return 'SOCIAL';
};

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
  role: user.role,
  enabledModules: user.enabledModules,
  isVerified: user.isVerified,
  isActive: user.isActive,
  isBanned: user.isBanned,
  subscriptionPlan: user.subscriptionPlan,
  language: user.language,
});

export const register = async (req: Request, res: Response) => {
  try {
    const { firebaseUid, phone, email, role: reqRole, language, modules } = req.body;

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
      const selectedModules: string[] = modules || [];
      if (reqRole === 'GROOM' && !selectedModules.includes('marriage')) selectedModules.push('marriage');
      if (reqRole === 'GUARDIAN' && !selectedModules.includes('guardian')) selectedModules.push('guardian');
      if (reqRole === 'BOTH') {
        if (!selectedModules.includes('marriage')) selectedModules.push('marriage');
        if (!selectedModules.includes('guardian')) selectedModules.push('guardian');
      }
      const role = reqRole || deriveRole(selectedModules);

      user = await prisma.user.create({
        data: {
          firebaseUid,
          phone,
          email,
          role: role as any,
          enabledModules: selectedModules,
          language: language || 'ar',
        },
      });
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

export const updateModules = async (req: AuthRequest, res: Response) => {
  try {
    const { modules } = req.body;
    if (!Array.isArray(modules)) {
      return res.status(400).json({ error: 'INVALID', message: 'modules must be an array' });
    }

    const validModules = ['marriage', 'guardian'];
    const filtered = modules.filter((m: string) => validModules.includes(m));
    const role = deriveRole(filtered);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        enabledModules: filtered,
        role: role as any,
      },
    });

    return res.json({ user: formatUser(user) });
  } catch (error) {
    console.error('Update modules error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update modules' });
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

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        profile: {
          include: { photos: { orderBy: { order: 'asc' }, take: 1 } },
        },
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
      role: user.role,
      enabledModules: user.enabledModules,
      isVerified: user.isVerified,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiry: user.subscriptionExpiry,
      language: user.language,
      isActive: user.isActive,
      isBanned: user.isBanned,
      hasProfile: !!user.profile,
      profileId: user.profile?.id,
      profilePhoto: user.profile?.photos?.[0]?.url || null,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get user' });
  }
};
