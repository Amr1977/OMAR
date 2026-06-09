import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

export const getUserReputation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string;

    const [serviceReviews, storeOrders] = await Promise.all([
      prisma.serviceReview.aggregate({
        where: { service: { providerId: userId } },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.order.count({
        where: { storeId: userId, status: 'DELIVERED' },
      }),
    ]);

    const avgRating = serviceReviews._avg?.rating ?? null;
    const reviewCount = serviceReviews._count?.rating ?? 0;

    if (avgRating !== null) {
      await prisma.user.update({
        where: { id: userId },
        data: { averageRating: avgRating, reviewCount },
      });
    }

    return res.json({
      userId,
      averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
      reviewCount,
      completedOrders: storeOrders,
    });
  } catch (error) {
    console.error('Get reputation error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get reputation' });
  }
};
