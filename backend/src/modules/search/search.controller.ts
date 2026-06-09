import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { q, type } = req.query;

    if (!q || (q as string).trim().length < 2) {
      return res.status(400).json({ error: 'QUERY_TOO_SHORT', messageAr: 'الاستعلام قصير جداً', messageEn: 'Query too short' });
    }

    const query = (q as string).trim();
    const searchType = (type as string) || 'all';

    const results: any = {};

    if (searchType === 'all' || searchType === 'profiles') {
      results.profiles = await prisma.profile.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { displayName: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { occupation: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        include: { photos: { where: { isPrimary: true }, take: 1 } },
      });
    }

    if (searchType === 'all' || searchType === 'services') {
      results.services = await prisma.service.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        include: { category: true },
      });
    }

    if (searchType === 'all' || searchType === 'stores') {
      results.stores = await prisma.store.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      });
    }

    if (searchType === 'all' || searchType === 'posts') {
      results.posts = await prisma.post.findMany({
        where: {
          privacy: 'PUBLIC',
          content: { contains: query, mode: 'insensitive' },
        },
        take: 5,
        include: {
          user: { select: { id: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (searchType === 'all' || searchType === 'serviceRequests') {
      results.serviceRequests = await prisma.serviceRequest.findMany({
        where: {
          status: 'OPEN',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        include: { category: true },
      });
    }

    return res.json({ query, results });
  } catch (error) {
    console.error('Global search error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Search failed' });
  }
};
