import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: '30d' as any,
  });
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { firebaseUid, phone, email, role, language } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid },
          ...(phone ? [{ phone }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'USER_EXISTS',
        messageAr: 'المستخدم موجود بالفعل',
        messageEn: 'User already exists',
      });
    }

    const user = await prisma.user.create({
      data: {
        firebaseUid,
        phone,
        email,
        role: role || 'GROOM',
        language: language || 'ar',
      },
    });

    const tokens = generateTokens(user.id);

    return res.status(201).json({
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        phone: user.phone,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        subscriptionPlan: user.subscriptionPlan,
        language: user.language,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Registration failed' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body;
    // In production, verify with Twilio
    // For now, accept any 6-digit code
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
      include: { profile: true },
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
      isVerified: user.isVerified,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpiry: user.subscriptionExpiry,
      language: user.language,
      isActive: user.isActive,
      isBanned: user.isBanned,
      hasProfile: !!user.profile,
      profileId: user.profile?.id,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get me error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get user' });
  }
};
