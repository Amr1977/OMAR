import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../config/database';

export const requirePremium = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (user?.subscriptionPlan === 'FREE') {
    return res.status(403).json({
      error: 'PREMIUM_REQUIRED',
      messageAr: 'هذه الميزة متاحة للمشتركين المميزين فقط',
      messageEn: 'This feature requires a Premium subscription',
      upgradeUrl: '/settings/subscription',
    });
  }
  next();
};

export const checkContactRequestLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (user?.subscriptionPlan === 'FREE') {
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const count = await prisma.contactRequest.count({
      where: {
        senderId: req.userId,
        createdAt: { gte: thisMonthStart },
      },
    });

    if (count >= 3) {
      return res.status(403).json({
        error: 'REQUEST_LIMIT_REACHED',
        messageAr: 'وصلت للحد المجاني (3 طلبات/شهر). يرجى الترقية للاشتراك المميز',
        messageEn: 'Free plan limit reached (3 requests/month). Please upgrade.',
        upgradeUrl: '/settings/subscription',
      });
    }
  }
  next();
};
