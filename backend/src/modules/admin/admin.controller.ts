import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

const p = (req: AuthRequest) => req.params as { id: string };

export const getDashboard = async (_req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalProfiles, pendingProfiles, reportsToday] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.profile.count({ where: { status: 'PENDING_AI_REVIEW' } }),
      prisma.report.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return res.json({
      totalUsers,
      totalProfiles,
      pendingProfiles,
      reportsToday,
      activeGrooms: await prisma.user.count({ where: { role: 'GROOM', isActive: true } }),
      activeGuardians: await prisma.user.count({ where: { role: 'GUARDIAN', isActive: true } }),
      premiumUsers: await prisma.user.count({ where: { subscriptionPlan: 'PREMIUM' } }),
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get dashboard' });
  }
};

export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { profile: { select: { id: true, displayName: true, status: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({ users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('List users error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list users' });
  }
};

export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    const params = p(req);
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    const banned = await prisma.user.update({
      where: { id: p(req).id },
      data: { isBanned: !user.isBanned },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.userId!,
        action: user.isBanned ? 'UNBAN_USER' : 'BAN_USER',
        targetId: p(req).id,
      },
    });

    return res.json({ isBanned: banned.isBanned });
  } catch (error) {
    console.error('Ban user error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to ban user' });
  }
};

export const verifyUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: p(req).id } });
    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    await prisma.user.update({
      where: { id: p(req).id },
      data: { isVerified: !user.isVerified },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.userId!,
        action: user.isVerified ? 'UNVERIFY_USER' : 'VERIFY_USER',
        targetId: p(req).id,
      },
    });

    return res.json({ message: 'User verification toggled' });
  } catch (error) {
    console.error('Verify user error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to verify user' });
  }
};

export const getPendingProfiles = async (_req: AuthRequest, res: Response) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: { status: 'PENDING_AI_REVIEW' },
      include: {
        user: { select: { id: true, isVerified: true } },
        photos: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(profiles);
  } catch (error) {
    console.error('Get pending profiles error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get pending profiles' });
  }
};

export const approveProfile = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.profile.update({
      where: { id: p(req).id },
      data: { status: 'APPROVED', publishedAt: new Date() },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.userId!,
        action: 'APPROVE_PROFILE',
        targetId: p(req).id,
      },
    });

    return res.json({ message: 'Profile approved' });
  } catch (error) {
    console.error('Approve profile error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to approve profile' });
  }
};

export const rejectProfile = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.profile.update({
      where: { id: p(req).id },
      data: { status: 'REJECTED' },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.userId!,
        action: 'REJECT_PROFILE',
        targetId: p(req).id,
      },
    });

    return res.json({ message: 'Profile rejected' });
  } catch (error) {
    console.error('Reject profile error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to reject profile' });
  }
};

export const listReports = async (_req: AuthRequest, res: Response) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { id: true } },
        reported: { select: { id: true } },
      },
    });

    return res.json(reports);
  } catch (error) {
    console.error('List reports error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list reports' });
  }
};

export const resolveReport = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.report.update({
      where: { id: p(req).id },
      data: { status: 'RESOLVED' },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.userId!,
        action: 'RESOLVE_REPORT',
        targetId: p(req).id,
      },
    });

    return res.json({ message: 'Report resolved' });
  } catch (error) {
    console.error('Resolve report error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to resolve report' });
  }
};

export const getLogs = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const logs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.adminLog.count();

    return res.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get logs error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get logs' });
  }
};
