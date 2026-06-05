import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

export const createDonation = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, paymentMethod, transactionImage, note } = req.body;
    if (!amount || !paymentMethod) {
      return res.status(400).json({ error: 'VALIDATION', message: 'amount and paymentMethod are required' });
    }
    if (!['INSTAPAY', 'VODAFONE_CASH', 'USDT_TRC20'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Invalid payment method' });
    }
    if (amount < 1) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Amount must be at least 1 EGP' });
    }

    const donation = await prisma.donation.create({
      data: {
        userId: req.userId!,
        amount,
        paymentMethod,
        transactionImage: transactionImage || null,
        note: note || null,
        status: 'PENDING',
      },
    });

    return res.status(201).json(donation);
  } catch (error) {
    console.error('Create donation error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to create donation' });
  }
};

export const listDonations = async (_req: AuthRequest, res: Response) => {
  try {
    const donations = await prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, phone: true, role: true } },
      },
    });
    return res.json(donations);
  } catch (error) {
    console.error('List donations error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list donations' });
  }
};

const p = (req: AuthRequest) => req.params as { id: string };

export const verifyDonation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const donation = await prisma.donation.findUnique({ where: { id } });
    if (!donation) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Donation not found' });
    }
    if (donation.status !== 'PENDING') {
      return res.status(400).json({ error: 'CONFLICT', message: 'Donation is not pending' });
    }

    const updated = await prisma.donation.update({
      where: { id },
      data: { status: 'VERIFIED' },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.userId!,
        action: 'VERIFY_DONATION',
        targetId: id,
        details: { userId: donation.userId },
      },
    });

    return res.json({ message: 'Donation verified', donation: updated });
  } catch (error) {
    console.error('Verify donation error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to verify donation' });
  }
};

export const declineDonation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const { adminNote } = req.body;

    const donation = await prisma.donation.findUnique({ where: { id } });
    if (!donation) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Donation not found' });
    }
    if (donation.status !== 'PENDING') {
      return res.status(400).json({ error: 'CONFLICT', message: 'Donation is not pending' });
    }

    const updated = await prisma.donation.update({
      where: { id },
      data: { status: 'DECLINED', adminNote: adminNote || null },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.userId!,
        action: 'DECLINE_DONATION',
        targetId: id,
        details: { userId: donation.userId, adminNote },
      },
    });

    return res.json({ message: 'Donation declined', donation: updated });
  } catch (error) {
    console.error('Decline donation error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to decline donation' });
  }
};
