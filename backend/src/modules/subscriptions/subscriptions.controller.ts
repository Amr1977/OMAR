import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

const PLAN_PRICES: Record<number, number> = {
  1: 150,
  3: 350,
  6: 600,
  12: 1000,
};

export const createSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentMethod, transactionImage, note, durationMonths = 1 } = req.body;
    if (!paymentMethod) {
      return res.status(400).json({ error: 'VALIDATION', message: 'paymentMethod is required' });
    }
    if (!['INSTAPAY', 'VODAFONE_CASH'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Invalid payment method' });
    }
    const months = [1, 3, 6, 12].includes(durationMonths) ? durationMonths : 1;
    const amount = PLAN_PRICES[months];

    const existing = await prisma.subscription.findFirst({
      where: { userId: req.userId!, status: 'PENDING' },
    });
    if (existing) {
      return res.status(400).json({ error: 'CONFLICT', message: 'You already have a pending subscription request' });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: req.userId!,
        amount,
        durationMonths: months,
        paymentMethod,
        transactionImage: transactionImage || null,
        note: note || null,
        status: 'PENDING',
      },
    });

    return res.status(201).json(subscription);
  } catch (error) {
    console.error('Create subscription error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to create subscription' });
  }
};

export const getMySubscription = async (req: AuthRequest, res: Response) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ subscription });
  } catch (error) {
    console.error('Get my subscription error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get subscription' });
  }
};

export const listSubscriptions = async (_req: AuthRequest, res: Response) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, phone: true, role: true } },
      },
    });
    return res.json(subscriptions);
  } catch (error) {
    console.error('List subscriptions error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list subscriptions' });
  }
};

const p = (req: AuthRequest) => req.params as { id: string };

export const verifySubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Subscription not found' });
    }
    if (subscription.status !== 'PENDING') {
      return res.status(400).json({ error: 'CONFLICT', message: 'Subscription is not pending' });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + subscription.durationMonths);

    const [updated] = await prisma.$transaction([
      prisma.subscription.update({
        where: { id },
        data: { status: 'VERIFIED', startDate: now, endDate },
      }),
      prisma.user.update({
        where: { id: subscription.userId },
        data: { subscriptionPlan: 'PREMIUM', subscriptionExpiry: endDate },
      }),
      prisma.adminLog.create({
        data: {
          adminId: req.userId!,
          action: 'VERIFY_SUBSCRIPTION',
          targetId: id,
          details: { userId: subscription.userId, durationMonths: subscription.durationMonths },
        },
      }),
    ]);

    return res.json({ message: 'Subscription verified', subscription: updated });
  } catch (error) {
    console.error('Verify subscription error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to verify subscription' });
  }
};

export const declineSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const { adminNote } = req.body;

    const subscription = await prisma.subscription.findUnique({ where: { id } });
    if (!subscription) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Subscription not found' });
    }
    if (subscription.status !== 'PENDING') {
      return res.status(400).json({ error: 'CONFLICT', message: 'Subscription is not pending' });
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: { status: 'DECLINED', adminNote: adminNote || null },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.userId!,
        action: 'DECLINE_SUBSCRIPTION',
        targetId: id,
        details: { userId: subscription.userId, adminNote },
      },
    });

    return res.json({ message: 'Subscription declined', subscription: updated });
  } catch (error) {
    console.error('Decline subscription error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to decline subscription' });
  }
};
