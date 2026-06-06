import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

const p = (req: AuthRequest) => req.params as { id: string };

export const listCategories = async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.serviceCategory.findMany({
      include: { children: true },
      orderBy: { nameAr: 'asc' },
    });
    return res.json(categories);
  } catch (error) {
    console.error('List categories error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list categories' });
  }
};

export const listServices = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, search, lat, lng, radius, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { status: 'ACTIVE' };
    if (categoryId) where.categoryId = categoryId as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          provider: { select: { id: true, email: true, roles: true, subscriptionPlan: true } },
          category: { select: { id: true, nameAr: true, nameEn: true } },
          reviews: { select: { rating: true } },
          _count: { select: { bookings: true } },
        },
      }),
      prisma.service.count({ where }),
    ]);

    const servicesWithStats = services.map((s) => {
      const avgRating = s.reviews.length > 0
        ? s.reviews.reduce((sum, r) => sum + r.rating, 0) / s.reviews.length
        : null;
      const { reviews, _count, ...rest } = s;
      return { ...rest, avgRating, bookingCount: _count.bookings };
    });

    return res.json({ services: servicesWithStats, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('List services error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to list services' });
  }
};

export const getMyServices = async (req: AuthRequest, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      where: { providerId: req.userId! },
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true } },
        reviews: { select: { rating: true } },
        _count: { select: { bookings: true } },
      },
    });
    const servicesWithStats = services.map((s) => {
      const avgRating = s.reviews.length > 0
        ? s.reviews.reduce((sum, r) => sum + r.rating, 0) / s.reviews.length
        : null;
      const { reviews, _count, ...rest } = s;
      return { ...rest, avgRating, bookingCount: _count.bookings };
    });
    return res.json(servicesWithStats);
  } catch (error) {
    console.error('Get my services error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get services' });
  }
};

export const getService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        provider: { select: { id: true, email: true, roles: true, subscriptionPlan: true } },
        category: { select: { id: true, nameAr: true, nameEn: true } },
        reviews: {
          include: { reviewer: { select: { id: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { bookings: true } },
      },
    });
    if (!service) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Service not found' });
    }
    const avgRating = service.reviews.length > 0
      ? service.reviews.reduce((sum, r) => sum + r.rating, 0) / service.reviews.length
      : null;
    const { reviews, _count, ...rest } = service;

    await prisma.service.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    return res.json({ ...rest, avgRating, reviewCount: reviews.length, reviews, bookingCount: _count.bookings });
  } catch (error) {
    console.error('Get service error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get service' });
  }
};

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const { categoryId, title, description, price, priceUnit, currency, latitude, longitude, address, city, governorate, images } = req.body;
    if (!categoryId || !title || !description || price === undefined) {
      return res.status(400).json({ error: 'VALIDATION', message: 'categoryId, title, description, and price are required' });
    }
    const service = await prisma.service.create({
      data: {
        providerId: req.userId!,
        categoryId,
        title,
        description,
        price: parseFloat(price),
        priceUnit: priceUnit || 'FIXED',
        currency: currency || 'EGP',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        address: address || null,
        city: city || null,
        governorate: governorate || null,
        images: images || [],
      },
    });
    return res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to create service' });
  }
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Service not found' });
    }
    if (existing.providerId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your service' });
    }
    const { categoryId, title, description, price, priceUnit, currency, latitude, longitude, address, city, governorate, images, status } = req.body;
    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(categoryId !== undefined && { categoryId }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(priceUnit !== undefined && { priceUnit }),
        ...(currency !== undefined && { currency }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(governorate !== undefined && { governorate }),
        ...(images !== undefined && { images }),
        ...(status !== undefined && { status }),
      },
    });
    return res.json(service);
  } catch (error) {
    console.error('Update service error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update service' });
  }
};

export const deleteService = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Service not found' });
    }
    if (existing.providerId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your service' });
    }
    await prisma.service.delete({ where: { id } });
    return res.json({ message: 'Service deleted' });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete service' });
  }
};

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const { message } = req.body;
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Service not found' });
    }
    if (service.providerId === req.userId) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Cannot book your own service' });
    }
    if (service.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'VALIDATION', message: 'Service is not active' });
    }
    const existing = await prisma.serviceBooking.findFirst({
      where: { serviceId: id, clientId: req.userId!, status: { in: ['PENDING', 'ACCEPTED'] } },
    });
    if (existing) {
      return res.status(400).json({ error: 'CONFLICT', message: 'You already have a pending booking for this service' });
    }
    const booking = await prisma.serviceBooking.create({
      data: { serviceId: id, clientId: req.userId!, message: message || null },
    });
    return res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to create booking' });
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    const [sent, received] = await Promise.all([
      prisma.serviceBooking.findMany({
        where: { clientId: req.userId! },
        orderBy: { createdAt: 'desc' },
        include: {
          service: { select: { id: true, title: true, price: true, currency: true, images: true } },
        },
      }),
      prisma.serviceBooking.findMany({
        where: { service: { providerId: req.userId! } },
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, email: true } },
          service: { select: { id: true, title: true, price: true, currency: true } },
        },
      }),
    ]);
    return res.json({ sent, received });
  } catch (error) {
    console.error('Get my bookings error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get bookings' });
  }
};

export const updateBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const { status: newStatus } = req.body;
    if (!['ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED'].includes(newStatus)) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Invalid status' });
    }
    const booking = await prisma.serviceBooking.findUnique({
      where: { id },
      include: { service: { select: { providerId: true } } },
    });
    if (!booking) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Booking not found' });
    }
    const isProvider = booking.service.providerId === req.userId;
    const isClient = booking.clientId === req.userId;
    if (!isProvider && !isClient) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your booking' });
    }
    if (newStatus === 'ACCEPTED' && !isProvider) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Only the provider can accept bookings' });
    }
    if (newStatus === 'CANCELLED' && !isClient) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Only the client can cancel bookings' });
    }
    if (newStatus === 'COMPLETED' && !isProvider) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Only the provider can mark bookings as completed' });
    }
    const updated = await prisma.serviceBooking.update({
      where: { id },
      data: { status: newStatus },
    });
    return res.json(updated);
  } catch (error) {
    console.error('Update booking error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update booking' });
  }
};

export const uploadServiceImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Service not found' });
    }
    if (service.providerId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your service' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'VALIDATION', message: 'No file provided' });
    }

    const maxImages = 10;
    if (service.images.length >= maxImages) {
      return res.status(400).json({
        error: 'LIMIT',
        messageAr: `الحد الأقصى ${maxImages} صور`,
        messageEn: `Maximum ${maxImages} images allowed`,
      });
    }

    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const updated = await prisma.service.update({
      where: { id },
      data: { images: { push: dataUrl } },
    });

    return res.json({ images: updated.images, added: dataUrl });
  } catch (error) {
    console.error('Upload service image error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to upload image' });
  }
};

export const deleteServiceImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'VALIDATION', message: 'URL is required' });
    }

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Service not found' });
    }
    if (service.providerId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your service' });
    }

    const filtered = service.images.filter((img) => img !== url);
    if (filtered.length === service.images.length) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Image not found' });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: { images: filtered },
    });

    return res.json({ images: updated.images });
  } catch (error) {
    console.error('Delete service image error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete image' });
  }
};

export const addReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = p(req);
    const { rating, content } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'VALIDATION', message: 'Rating must be between 1 and 5' });
    }
    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Service not found' });
    }
    const booking = await prisma.serviceBooking.findFirst({
      where: { serviceId: id, clientId: req.userId!, status: 'COMPLETED' },
    });
    if (!booking) {
      return res.status(400).json({ error: 'VALIDATION', message: 'You must have a completed booking to review' });
    }
    const existing = await prisma.serviceReview.findFirst({
      where: { serviceId: id, reviewerId: req.userId! },
    });
    if (existing) {
      return res.status(400).json({ error: 'CONFLICT', message: 'You already reviewed this service' });
    }
    const review = await prisma.serviceReview.create({
      data: { serviceId: id, reviewerId: req.userId!, rating, content: content || null },
    });
    return res.status(201).json(review);
  } catch (error) {
    console.error('Add review error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to add review' });
  }
};
