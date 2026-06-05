import { Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

const p = (req: AuthRequest) => req.params as { id: string };

export const createBride = async (req: AuthRequest, res: Response) => {
  try {
    const guardianId = req.userId!;
    const data = req.body;

    const bride = await prisma.bride.create({
      data: { guardianId, ...data },
    });
    return res.status(201).json(bride);
  } catch (error) {
    console.error('Create bride error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to create bride record' });
  }
};

export const getMyBrides = async (req: AuthRequest, res: Response) => {
  try {
    const brides = await prisma.bride.findMany({
      where: { guardianId: req.userId! },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(brides);
  } catch (error) {
    console.error('Get brides error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get bride records' });
  }
};

export const getBride = async (req: AuthRequest, res: Response) => {
  try {
    const bride = await prisma.bride.findFirst({
      where: { id: p(req).id, guardianId: req.userId! },
    });
    if (!bride) return res.status(404).json({ error: 'NOT_FOUND', message: 'Bride record not found' });
    return res.json(bride);
  } catch (error) {
    console.error('Get bride error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get bride record' });
  }
};

export const updateBride = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.bride.findFirst({
      where: { id: p(req).id, guardianId: req.userId! },
    });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Bride record not found' });

    const bride = await prisma.bride.update({
      where: { id: p(req).id },
      data: req.body,
    });
    return res.json(bride);
  } catch (error) {
    console.error('Update bride error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to update bride record' });
  }
};

export const deleteBride = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.bride.findFirst({
      where: { id: p(req).id, guardianId: req.userId! },
    });
    if (!existing) return res.status(404).json({ error: 'NOT_FOUND', message: 'Bride record not found' });

    await prisma.bride.delete({ where: { id: p(req).id } });
    return res.json({ message: 'Bride record deleted' });
  } catch (error) {
    console.error('Delete bride error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete bride record' });
  }
};
