import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

const p = (req: AuthRequest) => req.params as { id: string };

export const listNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.userId, isRead: false },
    });

    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('List notifications error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list notifications' });
  }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true },
    });

    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to mark all as read' });
  }
};

export const markOneRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { id: p(req).id, userId: req.userId },
      data: { isRead: true },
    });

    return res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark one read error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to mark as read' });
  }
};
