import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

const p = (req: AuthRequest) => req.params as { id: string };

export const getDashboard = async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalProfiles, pendingProfiles, reportsToday, totalPosts, totalMessages, totalConversations, totalFeedback, newUsersWeek, newPostsWeek, totalLikes, totalComments] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.profile.count({ where: { status: 'PENDING_AI_REVIEW' } }),
      prisma.report.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.post.count(),
      prisma.message.count(),
      prisma.conversation.count(),
      prisma.feedback.count(),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.post.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.postLike.count(),
      prisma.postComment.count(),
    ]);

    const [pendingSubscriptions, pendingDonations] = await Promise.all([
      prisma.subscription.count({ where: { status: 'PENDING' } }),
      prisma.donation.count({ where: { status: 'PENDING' } }),
    ]);

    const usersByRole = await prisma.user.groupBy({
      by: ['roles'],
      _count: { id: true },
    });

    return res.json({
      totalUsers,
      totalProfiles,
      pendingProfiles,
      reportsToday,
      totalPosts,
      totalMessages,
      totalConversations,
      totalFeedback,
      newUsersWeek,
      newPostsWeek,
      totalLikes,
      totalComments,
      activeGrooms: await prisma.user.count({ where: { roles: { array_contains: 'GROOM' } as any, isActive: true } }),
      activeGuardians: await prisma.user.count({ where: { roles: { array_contains: 'GUARDIAN' } as any, isActive: true } }),
      premiumUsers: await prisma.user.count({ where: { subscriptionPlan: 'PREMIUM' } }),
      usersByRole,
      pendingSubscriptions,
      pendingDonations,
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
    if (role) where.roles = { array_contains: role } as any;
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

export const listPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const where: any = {};
    if (search) where.content = { contains: search as string, mode: 'insensitive' };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, phone: true, roles: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);
    return res.json({ posts, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('List posts error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list posts' });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.post.delete({ where: { id: p(req).id } });
    await prisma.adminLog.create({
      data: { adminId: req.userId!, action: 'DELETE_POST', targetId: p(req).id },
    });
    return res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete post' });
  }
};

export const listConversations = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          participants: {
            include: { user: { select: { id: true, email: true, phone: true, roles: true } } },
          },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
      }),
      prisma.conversation.count(),
    ]);
    return res.json({ conversations, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    console.error('List conversations error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list conversations' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: p(req).id } });
    if (!user) return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    await prisma.user.delete({ where: { id: p(req).id } });
    await prisma.adminLog.create({
      data: { adminId: req.userId!, action: 'DELETE_USER', targetId: p(req).id },
    });
    return res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete user' });
  }
};

// ─── E-shop Admin ─────────────────────────────────────────────────────
export const adminListStores = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const [stores, total] = await Promise.all([
      prisma.store.findMany({ skip: (pageNum - 1) * limitNum, take: limitNum, orderBy: { createdAt: 'desc' }, include: { owner: { select: { id: true, email: true } }, _count: { select: { products: true, orders: true } } } }),
      prisma.store.count(),
    ]);
    return res.json({ stores, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Admin list stores error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list stores' });
  }
};

export const adminSuspendStore = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ error: 'NOT_FOUND', message: 'Store not found' });
    const newStatus = store.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const updated = await prisma.store.update({ where: { id }, data: { status: newStatus } });
    await prisma.adminLog.create({
      data: { adminId: req.userId!, action: newStatus === 'SUSPENDED' ? 'SUSPEND_STORE' : 'UNSUSPEND_STORE', targetId: id, details: { storeName: store.name } },
    });
    return res.json(updated);
  } catch (error) {
    console.error('Admin suspend store error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update store' });
  }
};

export const adminListProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const [products, total] = await Promise.all([
      prisma.product.findMany({ skip: (pageNum - 1) * limitNum, take: limitNum, orderBy: { createdAt: 'desc' }, include: { store: { select: { id: true, name: true } }, category: true } }),
      prisma.product.count(),
    ]);
    return res.json({ products, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Admin list products error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list products' });
  }
};

export const adminDeleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const product = await prisma.product.findUnique({ where: { id }, include: { store: true } });
    if (!product) return res.status(404).json({ error: 'NOT_FOUND', message: 'Product not found' });
    await prisma.product.delete({ where: { id } });
    await prisma.adminLog.create({
      data: { adminId: req.userId!, action: 'DELETE_PRODUCT', targetId: id, details: { productName: product.name, storeName: product.store?.name } },
    });
    return res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Admin delete product error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete product' });
  }
};

export const adminListOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ skip: (pageNum - 1) * limitNum, take: limitNum, orderBy: { createdAt: 'desc' }, include: { buyer: { select: { id: true, email: true } }, store: { select: { id: true, name: true } }, items: true } }),
      prisma.order.count(),
    ]);
    return res.json({ orders, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Admin list orders error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list orders' });
  }
};
