import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  enabledModules?: string[];
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive || user.isBanned) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not found or banned' });
    }

    req.userId = decoded.userId;
    req.userRole = user.role;
    req.enabledModules = user.enabledModules as string[];
    next();
  } catch (error) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (user && user.isActive && !user.isBanned) {
      req.userId = decoded.userId;
      req.userRole = user.role;
      req.enabledModules = user.enabledModules as string[];
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
};
